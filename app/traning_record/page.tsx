"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarToday as CalendarTodayIcon,
  ChevronLeft,
  ChevronRight,
  FitnessCenter as FitnessCenterIcon,
} from "@mui/icons-material";

export default function TrainingRecordCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainingDates, setTrainingDates] = useState<Set<string>>(new Set());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchTrainingRecords = async () => {
      try {
        const startDate = new Date(year, month, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
        const response = await fetch(
          `/api/traning_record?start_date=${startDate}&end_date=${endDate}`,
        );
        if (response.ok) {
          const records = await response.json();
          const dates = new Set<string>();
          records.forEach((record: { date: string }) => {
            const recordDate = new Date(record.date).toISOString().split("T")[0];
            dates.add(recordDate);
          });
          setTrainingDates(dates);
        }
      } catch (error) {
        console.error("Failed to fetch training records:", error);
      }
    };
    fetchTrainingRecords();
  }, [year, month]);

  const generateCalendar = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }

    return calendar;
  };

  const calendar = generateCalendar();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    router.push(`/traning_record/${dateStr}`);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const hasTraining = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return trainingDates.has(dateStr);
  };

  const handleStartTodayTraining = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    router.push(`/traning_record/${dateStr}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CalendarTodayIcon sx={{ fontSize: 32 }} className="text-blue-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">トレーニング記録</h1>
          </div>
          <p className="text-lg text-slate-600 ml-11">日付を選択してください</p>
        </div>
        <button
          onClick={handleStartTodayTraining}
          className="mb-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
        >
          <FitnessCenterIcon sx={{ fontSize: 24 }} />
          <span>今日のトレーニングを開始</span>
        </button>
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
              aria-label="前月"
            >
              <ChevronLeft sx={{ fontSize: 28 }} />
            </button>
            <h2 className="text-xl font-semibold text-slate-900">
              {year}年 {month + 1}月
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
              aria-label="翌月"
            >
              <ChevronRight sx={{ fontSize: 28 }} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-semibold py-2 ${
                  index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-slate-700"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendar.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              const dayOfWeek = index % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const todayClass = isToday(day);
              const hasTrain = hasTraining(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center font-medium text-sm
                    transition-all duration-200 transform hover:scale-105 hover:shadow-md relative
                    ${
                      todayClass
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : isSunday
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : isSaturday
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "bg-slate-50 hover:bg-blue-50 text-slate-700"
                    }
                  `}
                >
                  {day}
                  {hasTrain && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
