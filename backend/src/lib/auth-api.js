import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDatabase } from "../config/mongodb.js";

const roles = ["farmer", "buyer", "transporter", "storage", "government"];
const credentialsSchema = z.object({
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    password: z.string().min(6)
});
const signupSchema = credentialsSchema.extend({
    name: z.string().min(2).max(80).trim(),
    role: z.enum(roles)
});

export async function register(request, response, next) {
    try {
        const input = signupSchema.parse(request.body);
        const users = (await getDatabase()).collection("users");
        const existingUser = await users.findOne({ email: input.email });
        if (existingUser) return response.status(409).json({ error: "An account with this email already exists." });

        const user = {
            name: input.name,
            email: input.email,
            passwordHash: await bcrypt.hash(input.password, 12),
            role: input.role,
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
    return jwt.sign({ id: user._id?.toString() ?? user.id.toString(), role: user.role, name: user.name }, process.env.JWT_SECRET ?? "directagri-development-secret", { expiresIn: "7d" });
}

function publicUser(user) {
    return { id: user._id?.toString(), name: user.name, email: user.email, role: user.role };
}
