import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { z } from "zod";
import { getDatabase } from "../config/mongodb.js";

const roles = ["farmer", "buyer", "transporter", "storage", "government"];
const credentialsSchema = z.object({
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    password: z.string().min(6)
});
const signupSchema = credentialsSchema.extend({
    name: z.string().min(2).max(80).trim(),
    phone: z.string().trim().min(10).max(15).optional(),
    role: z.enum(roles)
});

export async function register(request, response, next) {
    try {
        const input = signupSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const existingUser = await users.findOne({ email: input.email });
        if (existingUser) return response.status(409).json({ error: "An account with this email already exists." });

        const defaultLocations = {
            farmer: "Pimpalgaon, Nashik",
            buyer: "Pune, Pune",
            transporter: "Nashik, Nashik",
            storage: "Niphad, Nashik",
            government: "Mumbai, Mumbai"
        };
        const user = {
            name: input.name,
            email: input.email,
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
        const input = credentialsSchema.parse(request.body);
        const user = await (await getDatabase()).collection("users").findOne({ email: input.email });
        if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
            return response.status(401).json({ error: "Email or password is incorrect." });
        }
        return response.json({ token: createToken(user), user: publicUser(user) });
    } catch (error) {
        return next(error);
    }
}

const forgotPasswordSchema = z.object({
    email: z.string().email().transform((value) => value.toLowerCase().trim())
});
const resetPasswordSchema = credentialsSchema.extend({
    code: z.string().trim().min(6).max(8)
});

export async function forgotPassword(request, response, next) {
    try {
        const input = forgotPasswordSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const user = await users.findOne({ email: input.email });
        if (!user) {
            return response.json({ message: "If an account exists for this email, a reset code is ready to use." });
        }

        const resetCode = String(crypto.randomInt(100000, 1000000));
        await users.findOneAndUpdate(
            { email: input.email },
            {
                $set: {
                    resetCodeHash: await bcrypt.hash(resetCode, 12),
                    resetCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
                }
            }
        );

        // try to send the reset code via email if SMTP is configured
        let mailerConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        if (mailerConfigured) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 587,
                    secure: (process.env.SMTP_SECURE === "true"),
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                const from = process.env.MAIL_FROM || process.env.SMTP_USER;
                await transporter.sendMail({
                    from,
                    to: input.email,
                    subject: "DirectAgri password reset code",
                    text: `Your DirectAgri password reset code is ${resetCode}. It expires in 15 minutes.`
                });
            } catch (mailErr) {
                console.error("Failed to send reset code email:", mailErr);
                mailerConfigured = false;
            }
        }

        // For security, only return the raw reset code in responses when mailer is not configured (development fallback).
        if (!mailerConfigured) {
            return response.json({ message: "Use this reset code to set a new password. It expires in 15 minutes.", resetCode });
        }

        return response.json({ message: "If an account exists for this email, a reset code has been sent." });
    } catch (error) {
        return next(error);
    }
}

export async function resetPassword(request, response, next) {
    try {
        const input = resetPasswordSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const user = await users.findOne({ email: input.email });
        const expired = !user?.resetCodeExpiresAt || new Date(user.resetCodeExpiresAt).getTime() < Date.now();
        const codeOk = user?.resetCodeHash && (await bcrypt.compare(input.code, user.resetCodeHash));
        if (!user || expired || !codeOk) {
            return response.status(400).json({ error: "Reset code is invalid or has expired." });
        }

        await users.findOneAndUpdate(
            { email: input.email },
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
    return { id: user._id?.toString(), name: user.name, email: user.email, phone: user.phone ?? "", role: user.role, location: user.location ?? null };
}
