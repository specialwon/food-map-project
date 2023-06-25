const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");
const indexDao = require("../dao/indexDao");

// 로그인 유지, 토큰 검증
exports.readJwt = async function (req, res) {
  const { userIdx, nickname } = req.verifiedToken;

  return res.send({
    result: { userIdx: userIdx, nickname: nickname },
    code: 200, // 요청 실패시 400번대 코드
    message: "유효한 토큰입니다.",
  });
};

// 로그인
exports.createJwt = async function (req, res) {
  const { userID, password } = req.body;

  if (!userID || !password) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "회원정보를 입력해주세요.",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      // 2. DB 회원 검증

      // 아이디 존재여부 부터 확인
      const [checkId] = await indexDao.isValidId(connection, userID);
      if (checkId[0]['COUNT(*)'] <= 0) {
        console.log("존재하지 않는 아이디 입니다.");
        return res.send({
          isSuccess: false,
          code: 402,
          message: "존재하지 않는 아이디 입니다.",
        });
      }

      const [rows] = await indexDao.isValidUsers(connection, userID, password);

      if (rows.length < 1) {
        return res.send({
          isSuccess: false,
          code: 403, // 요청 실패시 400번대 코드
          message: "비밀번호가 올바르지 않습니다.",
        });
      }

      const { userIdx, nickname } = rows[0];

      // 3. JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname }, // payload 정의
        secret.jwtsecret // 서버 비밀키
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "로그인 성공",
      });
    } catch (err) {
      logger.error(`createJwt Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createJwt DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};

// 회원가입
exports.createUsers = async function (req, res) {
  const { userID, password, nickname } = req.body;

  // 1. 유저 데이터 검증
  const userIDRegExp = /^[a-z]+[a-z0-9]{5,19}$/; // 아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[0-9a-zA-Z!@#$%^&*]{8,16}$/;
  const nicknameRegExp = /^[가-힣a-zA-Z0-9\s]{2,10}$/; // 닉네임 정규식 2-10 한글, 숫자 또는 영문

  if (!userIDRegExp.test(userID)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20",
    });
  }

  if (!passwordRegExp.test(password)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "비밀번호 정규식 8-16 문자, 숫자, 특수문자 조합",
    });
  }

  if (!nicknameRegExp.test(nickname)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "닉네임 정규식 2-10 한글, 숫자 또는 영문, 띄어쓰기 가능",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      // 아이디 중복 검사가 필요. 직접 구현해보기.
      const [checkId] = await indexDao.isValidId(connection, userID);
      if (checkId[0]['COUNT(*)'] > 0) {
        console.log(`아이디가 이미 존재합니다. 중복회수: ${checkId[0]['COUNT(*)']}`);
        return res.send({
          isSuccess: false,
          code: 401,
          message: "아이디에 중복이 발생했습니다.",
        });
      }else{
        console.log("사용하실 수 있는 아이디 입니다");
      }

      // 2. DB 입력
      const [rows] = await indexDao.insertUsers(
        connection,
        userID,
        password,
        nickname
      );

      // 입력된 유저 인덱스
      const userIdx = rows.insertId;

      // 3. JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname }, // payload 정의
        secret.jwtsecret // 서버 비밀키
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "회원가입 성공",
      });
    } catch (err) {
      logger.error(`createUsers Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createUsers DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};

// 식당 조회
exports.readRestaurants = async function (req, res) {
  const { category } = req.query;

  //카테고리 값이 넘어 왔다면, 유효한 값인지 체크
  if (category) {
    const validCategory = [
      "한식",
      "카페",
      "중식",
      "일식",
      "양식",
      "분식",
      "기타",
      "구이",
    ];

    if (!validCategory.includes(category)) {
      return res.send({
        isSuccess: false,
        code: 400, // 요청 실패시 400번대 코드
        message: "유효한 카테고리가 아닙니다. 쿼리스트링을 확인하세요.",
      });
    }
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await indexDao.selectRestaurants(connection, category);

      return res.send({
        result: rows,
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "식당 목록 조회 성공",
      });
    } catch (err) {
      logger.error(`readRestaurants Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(
      `readRestaurants DB Connection error\n: ${JSON.stringify(err)}`
    );
    return false;
  }
};


// // 학생 삭제
// exports.deleteStudent = async function (req, res) {
//   const { studentIdx } = req.params;

//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//     try {
//       const isValidStudentIdx = await indexDao.isValidStudentIdx(
//         connection,
//         studentIdx
//       );
//       if (!isValidStudentIdx) {
//         return res.send({
//           isSuccess: false,
//           code: 410,
//           message: "DELETC ERROR! 유효한 studentIdx값이 아닙니다.",
//         });
//       }

//       const [rows] = await indexDao.deleteStudent(connection, studentIdx);

//       return res.send({
//         result: rows,
//         isSuccess: true,
//         code: 200, // 요청 실패시 400번대 코드
//         message: "학생 삭제 성공",
//       });
//     } catch (err) {
//       logger.error(`deleteStudent Query error\n: ${JSON.stringify(err)}`);
//       return false;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     logger.error(`deleteStudent DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// };

// // 학생 업데이트
// exports.updateStudent = async function (req, res) {
//   const { studentName, major, birth, address } = req.body;
//   const { studentIdx } = req.params;

//   if (studentName && typeof studentName !== "string") {
//     return res.send({
//       isSuccess: false,
//       code: 400,
//       message: "PATCH ERROR! studentName 값을 정확히 입력해주세요",
//     });
//   }
//   if (major && typeof major !== "string") {
//     return res.send({
//       isSuccess: false,
//       code: 400,
//       message: "PATCH ERROR! major 값을 정확히 입력해주세요",
//     });
//   }
//   if (address && typeof address !== "string") {
//     return res.send({
//       isSuccess: false,
//       code: 400,
//       message: "PATCH ERROR! address 값을 정확히 입력해주세요",
//     });
//   }

//   // birth : YYYY-MM-DD 형식 검사
//   var regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
//   if (birth && !regex.test(birth)) {
//     return res.send({
//       isSuccess: false,
//       code: 400,
//       message: "PATCH ERROR! birth 값을 정확히 입력해주세요",
//     });
//   }

//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//     try {
//       const isValidStudentIdx = await indexDao.isValidStudentIdx(
//         connection,
//         studentIdx
//       );
//       if (!isValidStudentIdx) {
//         return res.send({
//           isSuccess: false,
//           code: 410,
//           message: "PATCH ERROR! 유효한 studentIdx값이 아닙니다.",
//         });
//       }

//       const [rows] = await indexDao.updateStudent(
//         connection,
//         studentIdx,
//         studentName,
//         major,
//         birth,
//         address
//       );

//       return res.send({
//         isSuccess: true,
//         code: 200,
//         message: "학생 수정 요청 성공",
//       });
//     } catch (err) {
//       logger.error(`updateStudent Query error\n: ${JSON.stringify(err)}`);
//       return false;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     logger.error(`updateStudent DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// };

// // 학생 생성
// exports.createStudent = async function (req, res) {
//   const { studentName, major, birth, address } = req.body;

//   // studentName, major, address: 문자열 여부 검사
//   if (
//     typeof studentName !== "string" ||
//     typeof major !== "string" ||
//     typeof major !== "string"
//   ) {
//     return res.send({
//       isSuccess: false,
//       code: 400,
//       message: "값에 오류가 있습니다. 정확히 입력해주세요.",
//     });
//   }
//   // birth : YYYY-MM-DD 형식 검사
//   var regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
//   if (!regex.test(birth)) {
//     return res.send({
//       isSuccess: false,
//       code: 400,
//       message: "값에 오류가 있습니다. 날짜 형식을 확인해주세요.",
//     });
//   }

//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//     try {
//       const [rows] = await indexDao.insertStudents(
//         connection,
//         studentName,
//         major,
//         birth,
//         address
//       );

//       return res.send({
//         isSuccess: true,
//         code: 200,
//         message: "학생 생성 요청 성공",
//       });
//     } catch (err) {
//       logger.error(`createStudent Query error\n: ${JSON.stringify(err)}`);
//       return false;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     logger.error(`createStudent DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// };

// // 예시 코드
// exports.example = async function (req, res) {
//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//     try {
//       const [rows] = await indexDao.exampleDao(connection);

//       return res.send({
//         result: rows,
//         isSuccess: true,
//         code: 200, // 요청 실패시 400번대 코드
//         message: "요청 성공",
//       });
//     } catch (err) {
//       logger.error(`example Query error\n: ${JSON.stringify(err)}`);
//       return false;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     logger.error(`example DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// };
