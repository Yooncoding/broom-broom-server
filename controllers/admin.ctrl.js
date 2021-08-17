const model = require("../models");

exports.get_admin_cog = async (req, res, next) => {
  const page = Number(req.query.page) ? Number(req.query.page) : 1;
  const contentSize = 20;
  const offset = (page - 1) * contentSize;
  const filter = Number(req.query.filter) ? false : true;
  try {
    const cog = await model.AdminCog.findAll({
      offset,
      limit: contentSize,
      paranoid: filter,
    });
    return res.status(200).json({ success: true, message: "충전/환급 요청내역들을 불러옵니다.", cog });
  } catch (e) {
    return next(e);
  }
};

exports.delete_admin_cog = async (req, res, next) => {
  const { id } = req.params;
  try {
    const cogType = await model.AdminCog.findOne({ where: { id }, include: { model: model.User, attributes: ["cash"] } });
    if (!cogType) {
      return res.status(400).json({ success: false, message: "없는 요청 또는 이미 승인이 완료된 요청입니다." });
    }
    if (cogType.type === "refund") {
      if (cogType.User.cash < cogType.amount) {
        return res.status(400).json({ success: false, message: "환급을 요청한 회원의 보유 포인트가 요청한 금액보다 적습니다." });
      } else {
        await model.User.update({ cash: cogType.User.cash - cogType.amount }, { where: { id: cogType.userId } });
        await model.AdminCog.destroy({ where: { id } });
        return res.status(200).json({ success: true, message: "환급요청에 대해 승인되었습니다." });
      }
    } else if (cogType.type === "charge") {
      await model.User.update({ cash: cogType.User.cash + cogType.amount }, { where: { id: cogType.userId } });
      await model.AdminCog.destroy({ where: { id } });
      return res.status(200).json({ success: true, message: "충전요청에 대해 승인되었습니다." });
    } else {
      return res.status(400).json({ success: false, message: "요청하신 충전 또는 환급요청 정보가 없습니다. 다시 시도해주세요." });
    }
  } catch (e) {
    return next(e);
  }
};
