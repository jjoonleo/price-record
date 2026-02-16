import { z } from 'zod';

export const DEFAULT_CAPTURE_COORDINATES = {
  latitude: 35.6812,
  longitude: 139.7671
} as const;

export const CAPTURE_NOTES_LIMIT = 140;

type CaptureValidationMessages = {
  productRequired: string;
  priceRequired: string;
  priceInvalidInteger: string;
  pricePositive: string;
  storeRequired: string;
  cityAreaRequired: string;
  dateRequired: string;
  locationRequired: string;
  addressRequired: string;
  coordinatesInvalid: string;
  notesTooLong: string;
};

const createCoordinateValidator = (min: number, max: number, invalidMessage: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) {
        return false;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max;
    }, invalidMessage);

export const createCaptureFormSchema = (messages: CaptureValidationMessages) =>
  z
    .object({
      productName: z.string().trim().min(1, messages.productRequired),
      priceYen: z
        .string()
        .trim()
        .min(1, messages.priceRequired)
        .refine((value) => /^\d+$/.test(value), messages.priceInvalidInteger)
        .refine((value) => Number(value) > 0, messages.pricePositive),
      storeName: z.string().trim().min(1, messages.storeRequired),
      cityArea: z.string().trim().min(1, messages.cityAreaRequired),
      latitude: createCoordinateValidator(-90, 90, messages.coordinatesInvalid),
      longitude: createCoordinateValidator(-180, 180, messages.coordinatesInvalid),
      observedAt: z.date({
        invalid_type_error: messages.dateRequired,
        required_error: messages.dateRequired
      }),
      addressLine: z.string(),
      notes: z.string().max(CAPTURE_NOTES_LIMIT, messages.notesTooLong),
      hasMapSelection: z.boolean().refine((value) => value, messages.locationRequired)
    })
    .superRefine((value, ctx) => {
      if (!value.hasMapSelection) {
        return;
      }
      if (value.addressLine.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.addressRequired,
          path: ['addressLine']
        });
      }
    });

export type CaptureFormValues = z.infer<ReturnType<typeof createCaptureFormSchema>>;

export const getCaptureFormDefaults = (): CaptureFormValues => ({
  productName: '',
  priceYen: '',
  storeName: '',
  cityArea: '',
  latitude: DEFAULT_CAPTURE_COORDINATES.latitude.toString(),
  longitude: DEFAULT_CAPTURE_COORDINATES.longitude.toString(),
  observedAt: new Date(),
  addressLine: '',
  notes: '',
  hasMapSelection: false
});
