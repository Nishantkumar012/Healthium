import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware';
import { ConsultationService } from '../../infrastructure/consultation/consultation.service';
import { logger } from '../../infrastructure/observability/logger';
import {
  CreateSlotRequest,
  BookConsultationRequest,
  CreatePaymentRequest,
  UpdateConsultationStatusRequest,
} from '../../common/types/consultation.types';

const router = Router();

// ==================== AVAILABILITY SLOTS ====================

// Create availability slot (doctor only)
router.post('/slots', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.userId;
    const { dayOfWeek, startTime, endTime, isRecurring, recurringEndDate } = req.body as CreateSlotRequest;

    // Validation
    if (dayOfWeek === undefined || !startTime || !endTime || isRecurring === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: dayOfWeek, startTime, endTime, isRecurring',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const slotId = await ConsultationService.createAvailabilitySlot(doctorId, {
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      recurringEndDate,
    });

    res.status(201).json({
      success: true,
      data: { slotId },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Create slot error', { error });
    const message = error instanceof Error ? error.message : 'Failed to create slot';

    if (message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Get availability slots for doctor
router.get('/slots/doctor/:doctorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const { dayOfWeek } = req.query;

    const slots = await ConsultationService.getAvailabilitySlots(
      doctorId,
      dayOfWeek ? parseInt(dayOfWeek as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: slots,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get slots error', { error });
    next(error);
  }
});

// Get my slots (doctor only)
router.get('/slots/my', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.userId;
    const { dayOfWeek } = req.query;

    const slots = await ConsultationService.getAvailabilitySlots(
      doctorId,
      dayOfWeek ? parseInt(dayOfWeek as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: slots,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get my slots error', { error });
    next(error);
  }
});

// ==================== CONSULTATIONS ====================

// Book consultation (patient only)
router.post('/book', authMiddleware, requireRole('patient'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.userId;
    const { slotId, chiefComplaint, consultationType } = req.body as BookConsultationRequest;

    // Validation
    if (!slotId || !chiefComplaint || !consultationType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: slotId, chiefComplaint, consultationType',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (!['video', 'audio', 'chat'].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid consultationType. Use: video, audio, or chat',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const consultationId = await ConsultationService.bookConsultation(patientId, {
      slotId,
      chiefComplaint,
      consultationType,
    });

    res.status(201).json({
      success: true,
      data: { consultationId },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Book consultation error', { error });
    const message = error instanceof Error ? error.message : 'Failed to book consultation';

    if (message.includes('already booked') || message.includes('Slot not found')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Get patient consultations
router.get('/my', authMiddleware, requireRole('patient'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.userId;
    const { status } = req.query;

    const consultations = await ConsultationService.getPatientConsultations(
      patientId,
      status as string | undefined
    );

    res.status(200).json({
      success: true,
      data: consultations,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get patient consultations error', { error });
    next(error);
  }
});

// Get doctor consultations
router.get('/doctor', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.userId;
    const { status } = req.query;

    const consultations = await ConsultationService.getDoctorConsultations(
      doctorId,
      status as string | undefined
    );

    res.status(200).json({
      success: true,
      data: consultations,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get doctor consultations error', { error });
    next(error);
  }
});

// Update consultation status (doctor only)
router.put('/:consultationId/status', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { consultationId } = req.params;
    const { status, notes } = req.body as UpdateConsultationStatusRequest;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (!['in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status. Use: in_progress, completed, or cancelled',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    await ConsultationService.updateConsultationStatus(consultationId, status, notes);

    res.status(200).json({
      success: true,
      data: { message: 'Consultation status updated' },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Update consultation status error', { error });
    const message = error instanceof Error ? error.message : 'Failed to update consultation';

    if (message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Cancel consultation (patient or doctor)
router.post('/:consultationId/cancel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { consultationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason is required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    await ConsultationService.cancelConsultation(consultationId, reason);

    res.status(200).json({
      success: true,
      data: { message: 'Consultation cancelled' },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Cancel consultation error', { error });
    next(error);
  }
});

// ==================== PAYMENTS ====================

// Create payment
router.post('/payment/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { consultationId, amount, paymentMethod } = req.body as CreatePaymentRequest;

    // Validation
    if (!consultationId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: consultationId, amount, paymentMethod',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (!['card', 'upi', 'wallet'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid paymentMethod. Use: card, upi, or wallet',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const paymentId = await ConsultationService.createPayment({
      consultationId,
      amount,
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      data: { paymentId },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Create payment error', { error });
    const message = error instanceof Error ? error.message : 'Failed to create payment';

    if (message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (message.includes('Invalid') || message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// ==================== PRESCRIPTIONS ====================

// Create prescription (doctor only)
router.post('/:consultationId/prescription', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { consultationId } = req.params;
    const { medications, instructions, validUntilDays } = req.body;

    if (!medications || !instructions) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: medications, instructions',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Medications must be a non-empty array',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const prescriptionId = await ConsultationService.createPrescription(
      consultationId,
      medications,
      instructions,
      validUntilDays || 30
    );

    res.status(201).json({
      success: true,
      data: { prescriptionId },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Create prescription error', { error });
    const message = error instanceof Error ? error.message : 'Failed to create prescription';

    if (message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Get patient prescriptions
router.get('/prescriptions/patient', authMiddleware, requireRole('patient'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.userId;
    const prescriptions = await ConsultationService.getPrescriptionsByPatient(patientId);

    res.status(200).json({
      success: true,
      data: prescriptions,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get patient prescriptions error', { error });
    next(error);
  }
});

// Get doctor prescriptions
router.get('/prescriptions/doctor', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.userId;
    const prescriptions = await ConsultationService.getPrescriptionsByDoctor(doctorId);

    res.status(200).json({
      success: true,
      data: prescriptions,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get doctor prescriptions error', { error });
    next(error);
  }
});

export default router;
