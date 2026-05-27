import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ todo: true });
});

export default router;
