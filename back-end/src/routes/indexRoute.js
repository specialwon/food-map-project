module.exports = function (app) {
  const index = require("../controllers/indexController");
  const jwtMiddleware = require("../../config/jwtMiddleware");

  // 라우터 정의
  // app.HTTP메서드(uri, 컨트롤러 콜백함수)
  // app.get("/dummy", index.example);
  // app.post("/students", index.createStudent);
  // app.patch("/students/:studentIdx", index.updateStudent);
  // app.delete("/students/:studentIdx", index.deleteStudent);

  app.get("/restaurant", index.readRestaurants);
  app.post("/sign-up", index.createUsers); // 회원가입
  app.post("/sign-in", index.createJwt); // 로그인
  app.get("/jwt", jwtMiddleware, index.readJwt); // 로그인 유지, 토큰 검증
};
