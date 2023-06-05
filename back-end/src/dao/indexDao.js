const { pool } = require("../../config/database");

// 식당조회 커리를 MY SQL로 날립니다.
exports.selectRestaurants = async function (connection, category) {

  const selectAllRestaurantsQuery = `SELECT title, address, category, videoUrl FROM FoodMap.Restaurants Where status = 'A';`;
  const selectCategorizedRestaurantsQuery = `SELECT title, address, category, videoUrl FROM FoodMap.Restaurants Where status = 'A' AND category = ?;`;

  const Params = [category];
  const Query = category ? selectCategorizedRestaurantsQuery : selectAllRestaurantsQuery;

  const rows = await connection.query(Query, Params);

  return rows;
};


// exports.deleteStudent = async function (connection, studentIdx) {
//   const Query = `update students set status = "D" where studentIdx = ?;`;
//   const Params = [studentIdx];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };

// exports.updateStudent = async function (connection, studentIdx, studentName, major, birth, address) {
//   const Query = `update students set studentName = ifnull(?, studentName), major = ifnull(?, major), birth = ifnull(?, birth), address = ifnull(?, birth) where studentIdx = ?;`;
//   const Params = [studentName, major, birth, address, studentIdx];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };

// exports.isValidStudentIdx = async function (connection, studentIdx) {
//   const Query = `SELECT * FROM students where studentIdx = ? and status = 'A';`;
//   const Params = [studentIdx];

//   const [rows] = await connection.query(Query, Params);
//   console.log("/*-------------- rows [0] ------------------- */")
//   console.log(rows[0]);
//   console.log("/*-------------- rows [1] ------------------- */")
//   console.log(rows[1]);
//   if (rows.length < 1) {
//     return false;
//   }

//   return true;
// };

// exports.insertStudents = async function (connection, studentName, major, birth, address) {
//   const Query = `insert into students(StudentName, major, birth, address) values (?, ?, ?, ?);`;
//   const Params = [studentName, major, birth, address];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };

// exports.exampleDao = async function (connection, params) {
//   const Query = ``;
//   const Params = [];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };
