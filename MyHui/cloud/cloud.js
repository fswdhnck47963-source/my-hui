const AV = require('leanengine');

AV.Cloud.define('bindPartner', async (request) => {
  // 从客户端获取当前登录的用户和伴侣的邮箱
  const user = request.currentUser;
  const { partnerEmail } = request.params;

  if (!user) {
    throw new AV.Cloud.Error('请先登录！', { code: 401 });
  }
  if (!partnerEmail) {
    throw new AV.Cloud.Error('请输入伴侣的邮箱。', { code: 400 });
  }
  if (partnerEmail === user.get('email')) {
    throw new AV.Cloud.Error('不能绑定自己哦！', { code: 400 });
  }

  // 使用 masterKey 查询，绕过权限限制
  const query = new AV.Query('_User');
  query.equalTo('email', partnerEmail);
  const partner = await query.first({ useMasterKey: true });

  if (!partner) {
    throw new AV.Cloud.Error('找不到该用户，请确认邮箱是否正确。', { code: 404 });
  }
  if (partner.get('partner')) {
    throw new AV.Cloud.Error('该用户已经绑定了另一半啦！', { code: 400 });
  }

  // 互相绑定
  user.set('partner', partner);
  partner.set('partner', user);

  // 使用 masterKey 保存，绕过权限限制
  await AV.Object.saveAll([user, partner], { useMasterKey: true });

  return { success: true, message: '绑定成功！' };
});
