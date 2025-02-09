import express, { Request, Response } from "express";

const router = express.Router();

router.get(
    '/api/v1/test',
    async (req: Request, res: Response) => {
        res.status(200).send({ 
            'hello': 'world',
        });
    }
);

export { router as testRouter };
