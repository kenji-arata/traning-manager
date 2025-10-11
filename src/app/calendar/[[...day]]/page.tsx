"use client";

import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { Stack, Typography } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const Calendar = ({ params }: { params: Promise<{ day?: string[] }> }) => {
  const [value, setValue] = React.useState<Dayjs | null>(null);
  const onChange = (newValue: Dayjs | null) => {
    setValue(newValue);
    console.log(newValue);
  };

  React.useEffect(() => {
    params.then(({ day }) => {
      // dayは配列なので、最初の要素を取得
      const dayParam = day?.[0];
      setValue(dayParam ? dayjs(dayParam) : null);
    });
  }, [params]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <Stack spacing={4}>
        <DateCalendar value={value} onChange={onChange} />
        <Typography sx={{ mt: 2 }}>
          現在の選択: {value ? value.format("YYYY/MM/DD") : "未選択"}
        </Typography>
      </Stack>
    </LocalizationProvider>
  );
};

export default Calendar;
