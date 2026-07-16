import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import chatRoutes from "./modules/chat/chat.route";
import messageRoutes from "./modules/message/message.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import { env } from "./config/env";
const app = express();


app.use(helmet());


app.use(morgan("dev"));

app.use(express.json());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use('/api/messages', messageRoutes)
app.use(errorMiddleware);

export default app;
