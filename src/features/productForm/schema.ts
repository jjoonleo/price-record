import { z } from 'zod';

export const PRODUCT_NOTE_LIMIT = 140;

type ProductFormMessages = {
  productNameRequired: string;
  productNoteTooLong: string;
};

export const createProductFormSchema = (messages: ProductFormMessages) =>
  z.object({
    name: z.string().trim().min(1, messages.productNameRequired),
    note: z.string().trim().max(PRODUCT_NOTE_LIMIT, messages.productNoteTooLong)
  });

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;

export const getProductFormDefaults = (): ProductFormValues => ({
  name: '',
  note: ''
});
