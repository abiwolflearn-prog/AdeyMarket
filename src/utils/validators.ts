import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("creator", "brand", "consumer").default("consumer"),
  displayName: Joi.string().max(100).allow("", null).optional(),
  // Company fields
  companyName: Joi.string().max(100).allow("", null).optional(),
  phone: Joi.string().max(30).allow("", null).optional(),
  city: Joi.string().max(100).allow("", null).optional(),
  address: Joi.string().max(200).allow("", null).optional(),
  businessCategory: Joi.string().max(100).allow("", null).optional(),
  taxId: Joi.string().max(50).allow("", null).optional(),
  website: Joi.string().max(250).allow("", null).optional(),
  // Creator fields
  username: Joi.string().max(50).allow("", null).optional(),
  niche: Joi.string().max(100).allow("", null).optional(),
  bio: Joi.string().max(500).allow("", null).optional(),
  tiktok: Joi.string().max(150).allow("", null).optional(),
  instagram: Joi.string().max(150).allow("", null).optional(),
  youtube: Joi.string().max(150).allow("", null).optional(),
  telegram: Joi.string().max(150).allow("", null).optional(),
}).unknown(true);

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required(),
});
