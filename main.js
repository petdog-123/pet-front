let editCurrentDogId = null;
let dogOriginList = [];
// 读取登录账号信息，不用手动改
const USER_ID = localStorage.getItem("userId") || sessionStorage.getItem("userId");
const TOKEN = localStorage.getItem("token") || sessionStorage.getItem("token");
// 后端固定端口3001，已经改好，不用手动改端口
const BASE_API = "https://pet-api-server-pjz846j00-pet14.vercel.app";
// 绑定页面所有标签id，和你原来页面完全匹配，不用改网页
const modal = document.getElementById('editModal')
const closeModalBtn = document.getElementById('closeModal')
const editDogForm = document.getElementById('editDogForm')

const eatForm1 = document.getElementById('eatForm1')
const poopForm1 = document.getElementById('poopForm1')
const eatForm2 = document.getElementById('eatForm2')
const poopForm2 = document.getElementById('poopForm2')
const dog1Title = document.getElementById('dog1Name')
const dog2Title = document.getElementById('dog2Name')

// 用来存放当前登录账号的数据，替代原来本地allData
let dogListCache = [];
let eatListCache = [];
let poopListCache = [];

// 统一发请求函数，自动带登录身份，登录过期跳登录页
async function request(url, options = {}) {
  const res = await fetch(`${BASE_API}${url}`, {
    headers: {
      "Content-Type": "application/json",
      token: TOKEN
    },
    ...options
  });
  const data = await res.json();
  if (data.code === 401) {
    localStorage.clear();
    sessionStorage.clear();
    location.href = "login.html";
  }
  return data;
}

function getRandomId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

// 页面打开自动执行
window.onload = async function () {
  // 没登录直接跳登录页
  if (!USER_ID || !TOKEN) {
    location.href = "login.html";
    return;
  }
  await loadAllData()
  dogOriginList = JSON.parse(JSON.stringify(dogListCache));
  bindAllSubmit()
  bindFoodCheck()
  renderAllRecord()
  bindFilterEvent();
}

// 从MySQL拉取当前登录账号专属数据
async function loadAllData() {
  // 只查当前用户的宠物
  const dogRes = await request(`/api/pet/list?userId=${USER_ID}`);
  dogListCache = dogRes.data || [];
  // 只查当前用户的喂食记录
  const eatRes = await request(`/api/eat/list?userId=${USER_ID}`);
  eatListCache = eatRes.data || [];
  // 只查当前用户的排便记录
  const poopRes = await request(`/api/poop/list?userId=${USER_ID}`);
  poopListCache = poopRes.data || [];

  renderDogInfo()
  refreshCardTitle()
}

// 页面两只狗狗名称自动刷新
function refreshCardTitle() {
  if (dogListCache[0]) {
    dog1Title.innerText = dogListCache[0].name
    eatForm1.dogId.value = dogListCache[0].id
    eatForm1.dogName.value = dogListCache[0].name
    poopForm1.dogId.value = dogListCache[0].id
    poopForm1.dogName.value = dogListCache[0].name
  }
  if (dogListCache[1]) {
    dog2Title.innerText = dogListCache[1].name
    eatForm2.dogId.value = dogListCache[1].id
    eatForm2.dogName.value = dogListCache[1].name
    poopForm2.dogId.value = dogListCache[1].id
    poopForm2.dogName.value = dogListCache[1].name
  }
}

// 食物多选拼接功能，和原来一模一样，没改动
function bindFoodCheck() {
  eatForm1.addEventListener('change', function () {
    const checks = eatForm1.querySelectorAll('.food-check:checked')
    const foodArr = Array.from(checks).map(el => el.value)
    document.getElementById('foodInput1').value = foodArr.join('、')
  })
  eatForm2.addEventListener('change', function () {
    const checks = eatForm2.querySelectorAll('.food-check:checked')
    const foodArr = Array.from(checks).map(el => el.value)
    document.getElementById('foodInput2').value = foodArr.join('、')
  })
}

// 渲染宠物列表，页面样式、文字完全没变
function renderDogInfo(showDogList = dogListCache) {
  const wrap = document.getElementById('dogList')
  wrap.innerHTML = ''
  showDogList.forEach(dog => {
    wrap.innerHTML += `
    <div class="dog-item">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h4>${dog.name} | ${dog.breed}</h4>
          <p>年龄：${dog.age}岁 生日：${dog.birthday} 体重：${dog.weight}</p>
          <p>疫苗备注：${dog.vaccine || "无"}</p>
        </div>
        <button class="edit-dog-btn" onclick="openEdit(${dog.id})">修改资料</button>
      </div>
    </div>
    `
  })
}

// 打开修改宠物弹窗
window.openEdit = function (dogId) {
  editCurrentDogId = dogId
  const dog = dogListCache.find(item => item.id === dogId)
  editDogForm.name.value = dog.name
  editDogForm.breed.value = dog.breed
  editDogForm.age.value = dog.age
  editDogForm.birthday.value = dog.birthday
  editDogForm.weight.value = dog.weight
  editDogForm.vaccine.value = dog.vaccine || ""
  editDogForm.id.value = dog.id
  modal.style.display = 'flex'
}

// 关闭弹窗
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none'
  editDogForm.reset()
})

// 提交修改宠物，自动带上当前登录用户ID存入数据库
editDogForm.addEventListener('submit', async e => {
  e.preventDefault()
  const formData = new FormData(editDogForm)
  const info = Object.fromEntries(formData)
  info.id = Number(info.id)
  info.userId = USER_ID;
  await request(`/api/pet/${info.id}`, {
    method: "PUT",
    body: JSON.stringify(info)
  })
  modal.style.display = 'none'
  await loadAllData()
  dogOriginList = JSON.parse(JSON.stringify(dogListCache));
  alert('宠物资料修改成功!')
})

// 所有喂食、排便提交事件，全部自动带上userId隔离账号
function bindAllSubmit() {
  // 狗狗1喂食
  eatForm1.addEventListener('submit', async function (e) {
    e.preventDefault()
    const foodVal = document.getElementById('foodInput1').value
    if (!foodVal) return alert('请至少勾选一种进食食材')
    const fd = new FormData(eatForm1)
    const data = Object.fromEntries(fd)
    data.userId = USER_ID;
    await request('/api/eat', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    eatForm1.reset()
    document.getElementById('foodInput1').value = ""
    await loadAllData()
    renderAllRecord()
    alert(`${dogListCache[0].name}喂食记录保存成功`)
  })
  // 狗狗1排便
  poopForm1.addEventListener('submit', async function (e) {
    e.preventDefault()
    const fd = new FormData(poopForm1)
    const data = Object.fromEntries(fd)
    data.userId = USER_ID;
    await request('/api/poop', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    poopForm1.reset()
    await loadAllData()
    renderAllRecord()
    alert(`${dogListCache[0].name}排便记录保存成功`)
  })
  // 狗狗2喂食
  eatForm2.addEventListener('submit', async function (e) {
    e.preventDefault()
    const foodVal = document.getElementById('foodInput2').value
    if (!foodVal) return alert('请至少勾选一种进食食材')
    const fd = new FormData(eatForm2)
    const data = Object.fromEntries(fd)
    data.userId = USER_ID;
    await request('/api/eat', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    eatForm2.reset()
    document.getElementById('foodInput2').value = ""
    await loadAllData()
    renderAllRecord()
    alert(`${dogListCache[1].name}喂食记录保存成功`)
  })
  // 狗狗2排便
  poopForm2.addEventListener('submit', async function (e) {
    e.preventDefault()
    const fd = new FormData(poopForm2)
    const data = Object.fromEntries(fd)
    data.userId = USER_ID;
    await request('/api/poop', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    poopForm2.reset()
    await loadAllData()
    renderAllRecord()
    alert(`${dogListCache[1].name}排便记录保存成功`)
  })
}

// 记录渲染、日期筛选，和原来完全一样
function renderAllRecord(filterDate = null) {
  const eatWrap = document.getElementById('eatList')
  const poopWrap = document.getElementById('poopList')
  let eatList = [...eatListCache]
  let poopList = [...poopListCache]

  if (filterDate) {
    eatList = eatList.filter(item => item.date === filterDate)
    poopList = poopList.filter(item => item.date === filterDate)
  }

  if (eatList.length === 0) {
    eatWrap.innerHTML = '<div style="padding:16px;color:#888">暂无喂食记录</div>'
  } else {
    let eatHtml = ''
    eatList.reverse().forEach(item => {
      eatHtml += `
      <div class="record-item">
        <div>
          <b>${item.petName}</b> ${item.date}｜${item.meal}｜心情：${item.mood}｜天气：${item.weather}
          <br>食物：${item.food} 备注：${item.note||'无'}
        </div>
        <button class="del-btn" onclick="del('eat','${item.recordId}')">删除</button>
      </div>
      `
    })
    eatWrap.innerHTML = eatHtml
  }

  if (poopList.length === 0) {
    poopWrap.innerHTML = '<div style="padding:16px;color:#888">暂无排便记录</div>'
  } else {
    let poopHtml = ''
    poopList.reverse().forEach(item => {
      poopHtml += `
      <div class="record-item">
        <div>
          <b>${item.petName}</b> ${item.date}
          <br>次数：${item.count}次，便便状态：${item.status} 备注：${item.note||'无'}
        </div>
        <button class="del-btn" onclick="del('poop','${item.recordId}')">删除</button>
      </div>
      `
    })
    poopWrap.innerHTML = poopHtml
  }
}

// 删除记录对接后端
window.del = async function (type, rid) {
  if (!confirm('确认删除这条记录？')) return
  await request(`/api/${type}/${rid}`, { method: "DELETE" })
  await loadAllData()
  renderAllRecord()
}

// 日期搜索功能完全不变
document.getElementById('searchBtn').addEventListener('click', () => {
  const day = document.getElementById('searchDate').value
  if (!day) return alert('请选择日期')
  renderAllRecord(day)
})
document.getElementById('showAll').addEventListener('click', () => {
  document.getElementById('searchDate').value = ''
  renderAllRecord()
})

// 宠物品种、体重筛选逻辑完全没改动
function bindFilterEvent() {
  document.getElementById('dogFilterBtn').addEventListener('click', () => {
    const breedVal = document.getElementById('breedFilter').value;
    const minW = parseFloat(document.getElementById('weightMin').value);
    const maxW = parseFloat(document.getElementById('weightMax').value);
    let filterArr = [...dogOriginList];
    if (breedVal !== 'all') filterArr = filterArr.filter(dog => dog.breed === breedVal);
    filterArr = filterArr.filter(dog => {
      const weightNum = parseFloat(dog.weight.replace('kg', ''));
      let pass = true;
      if (!isNaN(minW)) pass = pass && weightNum >= minW;
      if (!isNaN(maxW)) pass = pass && weightNum <= maxW;
      return pass;
    })
    renderDogInfo(filterArr);
  })
  document.getElementById('resetDogFilter').addEventListener('click', () => {
    document.getElementById('breedFilter').value = 'all';
    document.getElementById('weightMin').value = '';
    document.getElementById('weightMax').value = '';
    renderDogInfo(dogOriginList);
  })
}