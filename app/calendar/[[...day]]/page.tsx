"use client";

import * as React from "react";
import { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { Stack, Typography, List, ListItem, ListItemText } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Suspense } from "react";
import { BaseUrl } from "../../../lib/utils";

let trainingMenusPromise: Promise<string[]> | null = null;

const fetchTrainingMenus = (): Promise<string[]> => {
  if (!trainingMenusPromise) {
    trainingMenusPromise = fetch(`${BaseUrl()}/api/traning_menu`).then((response) =>
      response.json(),
    );
  }
  return trainingMenusPromise;
};

const TrainingMenus = () => {
  const trainingMenus = React.use(fetchTrainingMenus());

  return (
    <List>
      {trainingMenus.map((menu, index) => (
        <ListItem key={index}>
          <ListItemText primary={menu} />
        </ListItem>
      ))}
    </List>
  );
};

const Calendar = ({ params }: { params: Promise<{ day?: string[] }> }) => {
  const [value, setValue] = React.useState<Dayjs | null>(null);
  console.log(params);

  const onChange = (newValue: Dayjs | null) => {
    setValue(newValue);
    console.log(newValue);
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
        <Stack spacing={4}>
          <DateCalendar value={value} onChange={onChange} />
          <Typography sx={{ mt: 2 }}>
            現在の選択: {value ? value.format("YYYY/MM/DD") : "未選択"}
          </Typography>

          <Typography variant="h6" gutterBottom>
            トレーニングメニュー
          </Typography>
        </Stack>
      </LocalizationProvider>
      <Suspense fallback={<>読み込み中...</>}>
        <TrainingMenus />
      </Suspense>
    </>
  );
};

export default Calendar;
