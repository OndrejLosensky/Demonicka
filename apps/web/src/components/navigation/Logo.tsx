import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { config } from '../../config/index';

export function Logo() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="shrink-0 flex items-center"
    >
      <Link
        to="/"
        className="text-2xl font-bold text-primary flex items-center gap-2 relative"
      >
        <img
          src="/logo.svg"
          alt="Démonická"
          className="h-8 w-auto"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
          className="absolute -right-2 -top-2 bg-primary text-white rounded-full px-2 py-1 text-xs font-semibold transform rotate-12 shadow-lg"
        >
          v2.0
        </motion.div>
        {config.isDev && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
            className="absolute -left-2 -top-2 bg-yellow-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-lg z-10"
          >
            DEV
          </motion.div>
        )}
      </Link>
    </motion.div>
  );
}
