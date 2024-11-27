import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import 'reflect-metadata';
import cors from 'cors';
import mongoose from 'mongoose';

import './services/helpers/Secrets'
import { NotFoundError } from './errors/NotFoundError';
import { errorHandler } from './middlewares/ErrorHandler';

import cron from 'node-cron';
import { MigrationManager } from './services/MigrationManager';
import { BotManager } from './managers/bot/BotManager';
import { User } from './entities/User';
import { UserManager } from './managers/UserManager';

const app = express();
app.use(json());
app.use(cors());

app.all('*', async () => {
    throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
    await mongoose.connect(process.env.MONGODB_CONNECTION_URL!);
    console.log('Connected to mongodb!');

    await User.syncIndexes();

    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`Listening on port ${port}.`);
        onExpressStarted();
    });
}

const onExpressStarted = async () => {
    setupCron();
    setupBot();

    await MigrationManager.migrate();
}

const setupCron = async () => {
    cron.schedule('* * * * *', () => {
        // once a minute
        UserManager.cleanOldCache();
    });

}

const setupBot = async () => {
    await BotManager.getInstance();
}

start();