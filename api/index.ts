// @ts-ignore
import serverCjs from '../dist/server.cjs';

const app = (serverCjs as any).default || serverCjs;

export default app;

