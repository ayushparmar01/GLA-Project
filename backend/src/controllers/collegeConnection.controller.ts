import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CollegeEmployerConnection } from '../models/collegeEmployerConnection.model.js';
import { EmployerProfile } from '../models/employerProfile.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { ConnectionStatus } from '../types/index.js';

export const createConnectionRequest = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only registered employers can send college connection requests.' },
    });
    return;
  }

  const { collegeId, message } = req.body;

  if (!collegeId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Target collegeId is required.' },
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Valid target collegeId is required.' },
    });
    return;
  }

  if (message && (typeof message !== 'string' || message.length > 1000)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Message cannot exceed 1000 characters.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const employerObjectId = new mongoose.Types.ObjectId(req.user.sub);
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    // Validate college user exists and has role 'COLLEGE'
    const collegeUser = await User.findById(collegeObjectId);
    if (!collegeUser || collegeUser.role !== 'COLLEGE') {
      res.status(404).json({
        success: false,
        error: { code: 'COLLEGE_NOT_FOUND', message: 'No registered college institution found with the specified ID.' },
      });
      return;
    }

    // Check existing connection
    const existingConnection = await CollegeEmployerConnection.findOne({
      collegeId: collegeObjectId,
      employerId: employerObjectId,
    });

    if (existingConnection) {
      if (existingConnection.status === 'BLOCKED') {
        res.status(403).json({
          success: false,
          error: { code: 'BLOCKED_RELATIONSHIP', message: 'Connection requests to this institution are currently blocked.' },
        });
        return;
      }

      if (existingConnection.status === 'PENDING') {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_CONNECTION', message: 'A pending connection request already exists for this institution.' },
        });
        return;
      }

      if (existingConnection.status === 'ACCEPTED') {
        res.status(409).json({
          success: false,
          error: { code: 'ALREADY_CONNECTED', message: 'Your organization is already connected with this institution.' },
        });
        return;
      }

      // If previously REJECTED, permit re-application by resetting to PENDING
      existingConnection.status = 'PENDING';
      existingConnection.message = typeof message === 'string' ? message.trim() : undefined;
      existingConnection.reviewedBy = undefined;
      existingConnection.reviewedAt = undefined;
      await existingConnection.save();

      res.status(200).json({
        success: true,
        data: existingConnection.toSafeObject(
          collegeUser.collegeProfile?.institutionName || collegeUser.fullName
        ),
      });
      return;
    }

    const connection = new CollegeEmployerConnection({
      collegeId: collegeObjectId,
      employerId: employerObjectId,
      initiatedBy: 'EMPLOYER',
      message: typeof message === 'string' ? message.trim() : undefined,
      status: 'PENDING',
    });

    await connection.save();

    res.status(201).json({
      success: true,
      data: connection.toSafeObject(
        collegeUser.collegeProfile?.institutionName || collegeUser.fullName
      ),
    });
  } catch (error) {
    console.error('[Connection Error] Failed to create connection request:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to record connection request.' },
    });
  }
};

export const listEmployerConnections = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view their institutional connections.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const employerObjectId = new mongoose.Types.ObjectId(req.user.sub);
    const connections = await CollegeEmployerConnection.find({ employerId: employerObjectId }).sort({ createdAt: -1 });

    const collegeIds = connections.map((c) => c.collegeId);
    const colleges = await User.find({ _id: { $in: collegeIds } }).select('fullName collegeProfile');

    const collegeMap = new Map<string, string>();
    colleges.forEach((c) => {
      collegeMap.set(c._id.toString(), c.collegeProfile?.institutionName || c.fullName);
    });

    res.status(200).json({
      success: true,
      data: connections.map((conn) =>
        conn.toSafeObject(collegeMap.get(conn.collegeId.toString()))
      ),
    });
  } catch (error) {
    console.error('[Connection Error] Failed to list employer connections:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve connections.' },
    });
  }
};

export const listCollegeConnections = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only colleges can view incoming recruitment connections.' },
    });
    return;
  }

  const collegeId = req.params.collegeId as string;
  if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid college ID format.' },
    });
    return;
  }

  // College ownership check
  if (collegeId !== req.user.sub) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only view connection requests sent to your own institution.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const connections = await CollegeEmployerConnection.find({
      collegeId: new mongoose.Types.ObjectId(collegeId),
    }).sort({ createdAt: -1 });

    const employerIds = connections.map((c) => c.employerId);
    const profiles = await EmployerProfile.find({ userId: { $in: employerIds } });

    const companyMap = new Map<string, string>();
    profiles.forEach((p) => companyMap.set(p.userId.toString(), p.companyName));

    res.status(200).json({
      success: true,
      data: connections.map((conn) =>
        conn.toSafeObject(undefined, companyMap.get(conn.employerId.toString()) || 'Employer Partner')
      ),
    });
  } catch (error) {
    console.error('[Connection Error] Failed to list college connections:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve connections.' },
    });
  }
};

export const respondToConnection = async (req: Request, res: Response): Promise<void> => {
  // Only COLLEGE can respond to employer requests
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authorized college administrators can approve or reject connection requests.' },
    });
    return;
  }

  const connectionId = req.params.connectionId as string;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid connection ID format.' },
    });
    return;
  }

  if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Status must be ACCEPTED or REJECTED.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const connection = await CollegeEmployerConnection.findById(connectionId);
    if (!connection) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection request not found.' },
      });
      return;
    }

    // College ownership check
    if (connection.collegeId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only respond to connection requests for your own institution.' },
      });
      return;
    }

    if (connection.status === 'BLOCKED') {
      res.status(400).json({
        success: false,
        error: { code: 'BLOCKED_RELATIONSHIP', message: 'This connection is blocked. Unblock before accepting.' },
      });
      return;
    }

    connection.status = status as ConnectionStatus;
    connection.reviewedBy = new mongoose.Types.ObjectId(req.user.sub);
    connection.reviewedAt = new Date();

    await connection.save();

    res.status(200).json({
      success: true,
      data: connection.toSafeObject(),
    });
  } catch (error) {
    console.error('[Connection Error] Failed to respond to connection:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update connection status.' },
    });
  }
};

export const blockConnection = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only colleges can block connection relationships.' },
    });
    return;
  }

  const connectionId = req.params.connectionId as string;
  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid connection ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const connection = await CollegeEmployerConnection.findById(connectionId);
    if (!connection) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection record not found.' },
      });
      return;
    }

    if (connection.collegeId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only block connections directed to your own institution.' },
      });
      return;
    }

    connection.status = 'BLOCKED';
    connection.reviewedBy = new mongoose.Types.ObjectId(req.user.sub);
    connection.reviewedAt = new Date();

    await connection.save();

    res.status(200).json({
      success: true,
      data: connection.toSafeObject(),
    });
  } catch (error) {
    console.error('[Connection Error] Failed to block connection:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to block connection.' },
    });
  }
};
