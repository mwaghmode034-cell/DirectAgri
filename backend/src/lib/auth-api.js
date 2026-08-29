import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { z } from "zod";
import { getDatabase } from "../config/mongodb.js";

const roles = ["farmer", "buyer", "transporter", "storage", "government"];
const optionalEmailSchema = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().transform((value) => value.toLowerCase().trim()).optional()
);
const credentialsSchema = z.object({
    email: optionalEmailSchema,
    password: z.string().min(6)
});
const signupSchema = z.object({
    name: z.string().min(2).max(80).trim(),
    email: optionalEmailSchema,
    phone: z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z.string().trim().min(10).max(15).optional()
    ),
    password: z.string().min(6),
    role: z.enum(roles)
}).refine((value) => Boolean(value.email || value.phone), {
    message: "Either email or phone is required.",
    path: ["email"]
});

export async function register(request, response, next) {
    try {
        const input = signupSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const existingUser = input.email
            ? await users.findOne({ email: input.email })
            : await users.findOne({ phone: input.phone });
        if (existingUser) {
            return response.status(409).json({ error: input.email ? "An account with this email already exists." : "An account with this mobile number already exists." });
        }

        const defaultLocations = {
            farmer: "Pimpalgaon, Nashik",
            buyer: "Pune, Pune",
            transporter: "Nashik, Nashik",
            storage: "Niphad, Nashik",
            government: "Mumbai, Mumbai"
        };
        const user = {
            name: input.name,
            email: input.email ?? "",
            phone: input.phone ?? "",
            passwordHash: await bcrypt.hash(input.password, 12),
            role: input.role,
            location: defaultLocations[input.role],
            kycVerified: true,
            createdAt: new Date()
        };
        const result = await users.insertOne(user);
        const savedUser = { ...user, _id: result.insertedId };
        return response.status(201).json({ token: createToken(savedUser), user: publicUser(savedUser) });
    } catch (error) {
        return next(error);
    }
}

export async function login(request, response, next) {
    try {
        const rawBody = request.body ?? {};
        const email = typeof rawBody.email === "string" ? rawBody.email.trim().toLowerCase() : "";
        const phone = typeof rawBody.phone === "string" ? rawBody.phone.trim() : "";
        const password = typeof rawBody.password === "string" ? rawBody.password : "";
        if (!password || password.length < 6) {
            return response.status(400).json({ error: "Password is required." });
        }

        const query = email
            ? { email }
            : phone
                ? { $or: [{ phone }, { email: phone }] }
                : null;

        if (!query) {
            return response.status(400).json({ error: "Email or phone is required." });
        }

        const user = await (await getDatabase()).collection("users").findOne(query);
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return response.status(401).json({ error: "Email/phone or password is incorrect." });
        }
        return response.json({ token: createToken(user), user: publicUser(user) });
    } catch (error) {
        return next(error);
    }
}

const forgotPasswordSchema = z.object({
    email: optionalEmailSchema,
    phone: z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z.string().trim().min(8).max(20).optional()
    )
}).refine((value) => Boolean(value.email || value.phone), {
    message: "Email or phone is required.",
    path: ["email"]
});
const resetPasswordSchema = z.object({
    email: optionalEmailSchema,
    phone: z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z.string().trim().min(8).max(20).optional()
    ),
    code: z.string().trim().min(6).max(8),
    password: z.string().min(6)
}).refine((value) => Boolean(value.email || value.phone), {
    message: "Email or phone is required.",
    path: ["email"]
});

function resolveMailConfig() {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    const secure = String(process.env.SMTP_SECURE ?? process.env.EMAIL_SECURE ?? "false").toLowerCase() === "true";
    const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || user;
    return { host, user, pass, port, secure, from };
}

function resolveTwilioConfig() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    return { accountSid, authToken, phoneNumber };
}

async function sendSmsOtp(toPhoneNumber, resetCode) {
    try {
        const { accountSid, authToken, phoneNumber } = resolveTwilioConfig();
        if (!accountSid || !authToken || !phoneNumber) {
            console.warn("Twilio credentials not configured. SMS not sent.");
            return false;
        }
        const client = twilio(accountSid, authToken);
        await client.messages.create({
            body: `Your DirectAgri password reset code is ${resetCode}. It expires in 15 minutes. Do not share this code.`,
            from: phoneNumber,
            to: toPhoneNumber
        });
        return true;
    } catch (error) {
        console.error("Failed to send SMS via Twilio:", error.message);
        return false;
    }
}

export async function forgotPassword(request, response, next) {
    try {
        const input = forgotPasswordSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const user = await users.findOne(input.email ? { email: input.email } : { phone: input.phone });
        if (!user) {
            return response.json({
                message: input.phone
                    ? "If an account exists for this mobile number, a reset code is ready to use."
                    : "If an account exists for this email, a reset code is ready to use."
            });
        }

        const resetCode = String(crypto.randomInt(100000, 1000000));
        const userLookup = input.email ? { email: input.email } : { phone: input.phone };
        await users.findOneAndUpdate(
            userLookup,
            {
                $set: {
                    resetCodeHash: await bcrypt.hash(resetCode, 12),
                    resetCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
                }
            }
        );

        const contactValue = input.email ?? user.phone;
        const isPhoneFlow = !input.email && Boolean(user.phone);
        const mailConfig = resolveMailConfig();
        let sendSucceeded = false;

        if (input.email && mailConfig.host && mailConfig.user && mailConfig.pass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: mailConfig.host,
                    port: mailConfig.port,
                    secure: mailConfig.secure,
                    auth: { user: mailConfig.user, pass: mailConfig.pass }
                });
                await transporter.sendMail({
                    from: mailConfig.from,
                    to: input.email,
                    subject: "DirectAgri password reset code",
                    text: `Your DirectAgri password reset code is ${resetCode}. It expires in 15 minutes.`
                });
                sendSucceeded = true;
            } catch (mailErr) {
                console.error("Failed to send reset code email:", mailErr);
            }
        }

        if (!input.email && isPhoneFlow) {
            // Try to send SMS via Twilio
            sendSucceeded = await sendSmsOtp(user.phone, resetCode);
        }

        if (!sendSucceeded) {
            console.warn("Password reset code generated but no delivery provider was configured for this account.");
            if (!isPhoneFlow) {
                return response.status(503).json({
                    error: "Unable to send the reset email. Check the Gmail SMTP configuration and try again."
                });
            }
            return response.status(503).json({
                error: "Unable to send the reset SMS. Check the Twilio configuration and try again."
            });
        }

        if (isPhoneFlow) {
            return response.json({
                message: "A reset code has been sent to your mobile number.",
                deliveryMode: "sms"
            });
        }

        return response.json({
            message: "If an account exists for this email, a reset code has been sent.",
            deliveryMode: "email"
        });
    } catch (error) {
        return next(error);
    }
}

export async function resetPassword(request, response, next) {
    try {
        const input = resetPasswordSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const user = await users.findOne(input.email ? { email: input.email } : { phone: input.phone });
        const expired = !user?.resetCodeExpiresAt || new Date(user.resetCodeExpiresAt).getTime() < Date.now();
        const codeOk = user?.resetCodeHash && (await bcrypt.compare(input.code, user.resetCodeHash));
        if (!user || expired || !codeOk) {
            return response.status(400).json({ error: "Reset code is invalid or has expired." });
        }

        await users.findOneAndUpdate(
            input.email ? { email: input.email } : { phone: input.phone },
            {
                $set: {
                    passwordHash: await bcrypt.hash(input.password, 12),
                    resetCodeHash: null,
                    resetCodeExpiresAt: null
                }
            }
        );
        return response.json({ message: "Password updated. You can log in with your new password." });
    } catch (error) {
        return next(error);
    }
}

export function requireAuth(request, response, next) {
    const token = request.header("authorization")?.replace("Bearer ", "");
    if (!token) return response.status(401).json({ error: "Authentication required." });
    try {
        request.authUser = jwt.verify(token, process.env.JWT_SECRET ?? "directagri-development-secret");
        return next();
    } catch {
        return response.status(401).json({ error: "Session expired. Please log in again." });
    }
}

function createToken(user) {
    return jwt.sign({ id: user._id?.toString() ?? user.id.toString(), role: user.role, name: user.name, location: user.location ?? null }, process.env.JWT_SECRET ?? "directagri-development-secret", { expiresIn: "7d" });
}

function publicUser(user) {
    return { id: user._id?.toString(), name: user.name, email: user.email ?? "", phone: user.phone ?? "", role: user.role, location: user.location ?? null };
}
