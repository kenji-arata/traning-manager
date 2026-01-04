"use client";

import * as React from "react";
import { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { Stack, Typography } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { BaseUrl } from "../../../lib/utils";

const Calendar = ({}: { params: Promise<{ day?: string[] }> }) => {
  const [value, setValue] = React.useState<Dayjs | null>(null);

  const onChange = async (newValue: Dayjs | null) => {
    setValue(newValue);
    console.log(newValue);

    // test
    try {
      const response = await fetch(`${BaseUrl()}/api/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "NORMAL",
          score: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("スコアを保存しました:", data);
      } else {
        console.error("スコアの保存に失敗しました:", response.status);
      }

      // GETリクエストでスコア一覧を取得
      const getResponse = await fetch(`${BaseUrl()}/api/score`, {
        method: "GET",
      });

      if (getResponse.ok) {
        const scores = await getResponse.json();
        console.log("現在のスコア一覧:", scores);
      } else {
        console.error("スコアの取得に失敗しました:", getResponse.status);
      }
    } catch (error) {
      console.error("スコアの保存中にエラーが発生しました:", error);
    }
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
    </>
  );
};

export default Calendar;
