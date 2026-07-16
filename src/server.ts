import app from "./app";
import { env } from "./config/env";
// import { ensureQdrantIndexes } from "./services/vector/qdrant.service";

async function bootstrap() {
  // await ensureQdrantIndexes();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}
bootstrap();
