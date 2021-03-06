const model = require("../models");
const wkt = require("terraformer-wkt-parser");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

exports.get_address = async (req, res, next) => {
  try {
    const userAddress = await model.UserAddress.findOne({ where: { userId: req.user.id }, include: { model: model.District } });
    const data = { simpleAddress: userAddress.District.simpleAddress, addressScope: userAddress.addressScope };
    return res.status(200).json({
      success: true,
      message: "회원의 기준지역과 활동범위를 반환합니다.",
      data,
    });
  } catch (e) {
    return next(e);
  }
};

exports.post_check = async (req, res, next) => {
  const pool = require("../helpers/pool");
  const { addressScope } = req.body;
  try {
    const userAddress = await model.UserAddress.findOne({ where: { userId: req.user.id }, include: { model: model.District } });
    const conn = await pool.getConn();
    const [districts] = await conn.query(
      `SELECT * FROM districts WHERE ST_Intersects(geopolygon, ST_GeomFromText(ST_AsText(ST_Buffer(ST_GeomFromText(ST_AsText(ST_GeomFromText('${wkt.convert(
        userAddress.District.geopoint
      )}', 4326))), ${addressScope * 0.01})), 4326));`
    );
    conn.release();
    const neighborhoods = new Array();
    for (let i = 0; i < districts.length; i++) {
      neighborhoods.push(districts[i].simpleAddress);
    }
    const data = { count: neighborhoods.length, neighborhoods };
    return res.status(200).json({ success: true, message: "활동범위내 근처동네들을 불러옵니다.", data });
  } catch (e) {
    return next(e);
  }
};

exports.get_search = async (req, res, next) => {
  // TODO: 프론트개발자와 상의후 페이지네이션 넣을지 말지 결정
  // TODO: 검색엔진 최적화 해야할듯
  /**
   * @검색이_안되는_경우
   * 경기 부천 => 시도명은 경기도, 전라북도, 충청남도 이런식으로 "도"까지 풀네임으로 적어줘야함
   * 경기도부천시중동 => 띄어쓰기 살려주어야함
   * @이상적인_검색방법
   * 부천 중동 => (부천, 중동 각각 따로 입력해도 가능)
   * 경기도 부천시 중동 => (경기도, 부천시, 중동 각각 따로 입력해도 가능)
   * 부천시 중동
   */
  let { name } = req.query;
  if (name != undefined) {
    name = name.trim();
  }
  try {
    const districts = await model.District.findAll({
      where: {
        [Op.or]: [
          {
            EMDNM: { [Op.like]: "%" + name + "%" },
          },
          {
            SGGNM: { [Op.like]: "%" + name + "%" },
          },
          {
            SIDONM: { [Op.like]: "%" + name + "%" },
          },
          {
            ADMNM: { [Op.like]: "%" + name + "%" },
          },
          {
            simpleAddress: { [Op.like]: "%" + name + "%" },
          },
        ],
      },
    });
    const result = new Array();
    for (let i = 0; i < districts.length; i++) {
      result.push({ ADMNM: districts[i].ADMNM, districtId: districts[i].id });
    }
    const data = {
      count: districts.length,
      result,
    };
    return res.status(200).json({ success: true, message: "기준지역 검색결과를 불러옵니다.", data });
  } catch (e) {
    return next(e);
  }
};

exports.put_address = async (req, res, next) => {
  const pool = require("../helpers/pool");
  const districtId = req.params.id;
  try {
    const district = await model.District.findOne({ where: { id: districtId }, attributes: ["geopoint"] });
    const userAddress = await model.UserAddress.findOne({ where: { userId: req.user.id } });
    const conn = await pool.getConn();
    const [districts] = await conn.query(
      `SELECT * FROM districts WHERE ST_Intersects(geopolygon, ST_GeomFromText(ST_AsText(ST_Buffer(ST_GeomFromText(ST_AsText(ST_GeomFromText('
      ${wkt.convert(district.geopoint)}', 4326))), ${userAddress.addressScope * 0.01})), 4326));`
    );
    conn.release();
    let neighborhoods = new String();
    for (let i = 0; i < districts.length; i++) {
      neighborhoods += districts[i].id + ",";
    }
    neighborhoods = neighborhoods.slice(0, -1);
    await model.UserAddress.update({ districtId, neighborhoods }, { where: { userId: req.user.id } });
    return res.status(200).json({ success: true, message: "기준지역을 변경이 완료되었습니다." });
  } catch (e) {
    return next(e);
  }
};

exports.post_address = async (req, res, next) => {
  const pool = require("../helpers/pool");
  const { addressScope } = req.body;
  try {
    const userAddress = await model.UserAddress.findOne({ where: { userId: req.user.id }, include: { model: model.District } });
    const conn = await pool.getConn();
    const [districts] = await conn.query(
      `SELECT * FROM districts WHERE ST_Intersects(geopolygon, ST_GeomFromText(ST_AsText(ST_Buffer(ST_GeomFromText(ST_AsText(ST_GeomFromText('${wkt.convert(
        userAddress.District.geopoint
      )}', 4326))), ${addressScope * 0.01})), 4326));`
    );
    conn.release();
    let neighborhoods = new String();
    for (let i = 0; i < districts.length; i++) {
      neighborhoods += districts[i].id + ",";
    }
    neighborhoods = neighborhoods.slice(0, -1);
    await model.UserAddress.update({ neighborhoods, addressScope }, { where: { userId: req.user.id } });
    return res.status(200).json({ success: true, message: "활동지역 설정이 완료되었습니다." });
  } catch (e) {
    return next(e);
  }
};
