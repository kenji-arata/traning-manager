"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarToday as CalendarTodayIcon,
  ChevronLeft,
  ChevronRight,
  FitnessCenter as FitnessCenterIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { useWeeklyStats } from "../../hooks/useWeeklyStats";
import { useTrainingRecords } from "../../hooks/useTrainingRecords";

export default function TrainingRecordCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ローカル時間で日付文字列を作成（UTC時間のtoISOString()はずれるため）
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const startDate = formatLocalDate(new Date(year, month, 1));
  const endDate = formatLocalDate(new Date(year, month + 1, 0));

  const { records } = useTrainingRecords(startDate, endDate);
  const { stats: weeklyStats } = useWeeklyStats(startDate, endDate);

  // トレーニング記録がある日付のセットを作成
  const trainingDates = useMemo(() => {
    const dates = new Set<string>();
    records.forEach((record) => {
      const recordDate = new Date(record.date).toISOString().split("T")[0];
      dates.add(recordDate);
    });
    return dates;
  }, [records]);

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

  const formatWeekRange = (weekStart: string) => {
    // 文字列をローカル時間の日付として解釈（UTCとのずれを防ぐ）
    const [year, month, day] = weekStart.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // fix
  const getBodyPartColor = (bodyPartName: string) => {
    const colors: Record<string, string> = {
      胸: "bg-red-100 text-red-700",
      背中: "bg-blue-100 text-blue-700",
      肩: "bg-yellow-100 text-yellow-700",
      腕: "bg-green-100 text-green-700",
      足: "bg-orange-100 text-orange-700",
    };
    return colors[bodyPartName] || "bg-gray-100 text-gray-700";
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 mb-6">
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

        {/* 週次統計セクション */}
        {weeklyStats.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChartIcon sx={{ fontSize: 28 }} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">週ごとの実績</h2>
            </div>
            <div className="space-y-4">
              {weeklyStats.map((week) => (
                <div key={week.weekStart} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-slate-800 mb-3">
                    {formatWeekRange(week.weekStart)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {week.bodyParts.map((bodyPart) => (
                      <div
                        key={bodyPart.name}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm ${getBodyPartColor(bodyPart.name)}`}
                      >
                        {bodyPart.name}: {bodyPart.sets.toFixed(1)}セット
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
