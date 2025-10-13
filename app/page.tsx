import { neon } from "@neondatabase/serverless";
import React from "react";

const fetchComments = async () => {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT * FROM test_comments`;
    const recordList = Array.from(result);
    return recordList;
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
};

const Home = () => {
  const comments = React.use(fetchComments());
  console.log(comments);

  return <>{comments.map((comment) => comment.comment)}</>;
};

export default Home;
