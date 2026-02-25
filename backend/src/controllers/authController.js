import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, picture } = ticket.getPayload();
        const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : null;
        const userEmail = email.trim().toLowerCase();
        const isActuallyAdmin = adminEmail && userEmail === adminEmail;

        // Find or create user
        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({
                email,
                name,
                role: isActuallyAdmin ? 'admin' : 'user'
            });
        } else if (isActuallyAdmin && user.role !== 'admin') {
            // Auto-promote if email matches admin env
            user.role = 'admin';
            await user.save();
        }

        const sessionToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            token: sessionToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                picture
            }
        });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(401).json({ error: 'Auth failed' });
    }
};
