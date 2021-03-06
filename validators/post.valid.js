const title_regex = /^.{4,40}$/;
const description_regex = /^.{8,400}$/;
const name_regex = /^.{1,20}$/;
const now = Date.now();
const s3 = require("../config/s3.config");

exports.post_post = (req, res, next) => {
  // TODO: requiredTime 유효성검사
  // TODO: 코드 좀 깔끔하게 수정할 것 (다른 파일의 코드들도 마찬가지)
  const { title, price, description, deadline } = req.body;
  const parseDeadline = new Date(deadline);
  const images = req.files;
  const imagesURI = images.map((img) => img.key);
  const imagesObjects = [];
  for (let i = 0; i < imagesURI.length; i++) {
    imagesObjects.push({ Key: imagesURI[i] });
  }
  if (!images) {
    if (!title_regex.test(title)) {
      return res.status(400).json({ success: false, message: "심부름 제목은 최소 4글자, 최대 40글자까지만 입력가능합니다." });
    }
    if (isNaN(parseDeadline.getTime())) {
      return res.status(400).json({ success: false, message: "마감시간은 숫자만 입력가능합니다." });
    } else {
      if (parseDeadline < now) {
        return res.status(400).json({ success: false, message: "마감시간은 현재시간보다 이후 시간만 입력가능합니다." });
      }
      if (parseDeadline.getFullYear() > 2099) {
        return res.status(400).json({ success: false, message: "마감시간의 년도는 2099년도 이전으로만 입력가능합니다." });
      }
    }
    if (!description_regex.test(description)) {
      return res.status(400).json({ success: false, message: "심부름 내용은 최소 8글자, 최대 400글자까지만 입력가능합니다." });
    }
    if (price < 1000) {
      return res.status(400).json({ success: false, message: "가격은 1000원이상부터 입력가능합니다." });
    }
    if (price % 10 != 0) {
      return res.status(400).json({ success: false, message: "가격의 최소단위는 10원입니다." });
    }
    next();
  } else {
    try {
      if (!title_regex.test(title)) {
        return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
          res.status(400).json({ success: false, message: "심부름 제목은 최소 4글자, 최대 40글자까지만 입력가능합니다." });
        });
      }
      if (isNaN(parseDeadline.getTime())) {
        return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
          res.status(400).json({ success: false, message: "마감시간은 숫자만 입력가능합니다." });
        });
      } else {
        if (parseDeadline < now) {
          return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
            res.status(400).json({ success: false, message: "마감시간은 현재시간보다 이후 시간만 입력가능합니다." });
          });
        }
        if (parseDeadline.getFullYear() > 2099) {
          return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
            res.status(400).json({ success: false, message: "마감시간의 년도는 2099년도 이전으로만 입력가능합니다." });
          });
        }
      }
      if (!description_regex.test(description)) {
        return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
          res.status(400).json({ success: false, message: "심부름 내용은 최소 8글자, 최대 400글자까지만 입력가능합니다." });
        });
      }
      if (price < 1000) {
        return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
          res.status(400).json({ success: false, message: "가격은 1000원이상부터 입력가능합니다." });
        });
      }
      if (price % 10 != 0) {
        return s3.deleteObjects({ Bucket: "broombroom", Delete: { Objects: imagesObjects } }, () => {
          res.status(400).json({ success: false, message: "가격의 최소단위는 10원입니다." });
        });
      }
      next();
    } catch (e) {
      return next(e);
    }
  }
};

exports.post_review = (req, res, next) => {
  const { reviewPoint } = req.body;
  if (reviewPoint >= 0 && reviewPoint <= 5) {
    next();
  } else {
    return res.status(400).json({ success: false, message: "리뷰점수는 0~5점까지만 가능합니다." });
  }
};

exports.get_search = (req, res, next) => {
  const { name, order, filter } = req.query;
  name.trim();
  if (!name_regex.test(name)) {
    return res.status(400).json({ success: false, message: "검색 키워드는 1~20글자만 입력가능합니다." });
  }
  if (order !== undefined) {
    if (order !== "updatedAt" && order !== "deadline" && order !== "price") {
      return res.status(400).json({ success: false, message: "정렬방식은 updatedAt, deadline, price만 입력가능합니다." });
    }
  }
  if (filter !== undefined) {
    if (filter !== "1" && filter !== "0") {
      return res.status(400).json({ success: false, message: "심부름 불가능 안보기 버튼 클릭시 filter은 1이고 다시 해제했을때는 0입니다. 0과 1을 제외하고는 값을 주면 안됩니다." });
    }
  }
  next();
};
