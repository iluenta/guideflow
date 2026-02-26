import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon?: React.ReactNode;
  chartData?: {
    value: number;
  }[];
  accentColor?: string;
  delay?: number;
}
export function StatCard({
  title,
  value,
  trend,
  trendDirection = 'up',
  icon,
  chartData,
  accentColor = '#6366F1',
  delay = 0
}: StatCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.4,
        delay
      }}
      className="relative bg-white rounded-xl p-6 shadow-card border border-gray-100 overflow-hidden group hover:shadow-soft transition-shadow">

      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          backgroundColor: accentColor
        }} />


      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-heading font-bold text-navy">{value}</h3>
        </div>
        {icon &&
        <div className="p-2 bg-gray-50 rounded-lg text-gray-500 group-hover:text-navy transition-colors">
            {icon}
          </div>
        }
      </div>

      <div className="flex items-end justify-between">
        {trend &&
        <div
          className={`flex items-center text-sm font-medium ${trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>

            {trendDirection === 'up' ?
          <ArrowUpRight className="w-4 h-4 mr-1" /> :

          <ArrowDownRight className="w-4 h-4 mr-1" />
          }
            {trend}
            <span className="text-gray-400 ml-1 font-normal">vs last week</span>
          </div>
        }

        {chartData &&
        <div className="h-10 w-24 ml-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <Area
                type="monotone"
                dataKey="value"
                stroke={accentColor}
                fill={accentColor}
                fillOpacity={0.1}
                strokeWidth={2} />

              </AreaChart>
            </ResponsiveContainer>
          </div>
        }
      </div>
    </motion.div>);

}