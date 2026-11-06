import * as clinic from '../services/clinic.service.js';
import { ok } from '../utils/respond.js';

export async function getClinic(_req, res, next) {
  try {
    return ok(res, await clinic.getPublicClinic());
  } catch (err) {
    return next(err);
  }
}

export async function getServices(_req, res, next) {
  try {
    return ok(res, await clinic.getPublicServices());
  } catch (err) {
    return next(err);
  }
}
