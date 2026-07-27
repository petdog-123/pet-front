let editCurrentDogId = null;
let dogOriginList = [];
// 读取登录账号信息
const USER_ID = localStorage.getItem("userId") || sessionStorage.getItem("userId");
const TOKEN = localStorage.getItem("token") || sessionStorage.getItem("token");
// 后端云端地址，不用改
const BASE_API = "https://pet-api-server-pjz846j00-pet14.vercel.app";

// 绑定页面所有标签id
const modal = document.getElementById('editModal')
const closeModalBtn = document.getElementById('closeModal')
const editDogForm = document.getElementById('editDogForm')

const eatForm1 = document.getElementById('eatForm1')
const poopForm1 = document.getElementById('poopForm1')
const eatForm2 = document.getElementById('eatForm2')
const poopForm2 = document.getElementById('poopForm2')
const dog1Title = document.getElementById('dog1Name')
const dog2Title = document.getElementById('dog2Name')

// 用来存放当前登录账号的数据
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
    alert("登录失效，请重新登录");
    location.href = "login.html";
  }
  return data;
}

// 页面加载立刻拉取全部狗狗数据
window.onload = async function () {
  if (!TOKEN) {
    location.href = "login.html";
    return;
  }
  await getDogList();
  await renderAll();
};

// 获取狗狗基础列表
async function getDogList() {
  const res = await request("/api/dog/list");
  if (res.code === 200) {
    dogListCache = res.data;
  }
}

// 渲染两只狗狗名字
function renderDogName() {
  if (dogListCache.length >= 1) dog1Title.innerText = dogListCache[0].dogName;
  if (dogListCache.length >= 2) dog2Title.innerText = dogListCache[1].dogName;
}

// 获取饮食记录
async function getEatList() {
  const res = await request("/api/eat/list");
  if (res.code === 200) eatListCache = res.data;
}

// 获取排便记录
async function getPoopList() {
  const res = await request("/api/poop/list");
  if (res.code === 200) poopListCache = res.data;
}

// 全部刷新渲染
async function renderAll() {
  renderDogName();
  await getEatList();
  await getPoopList();
  renderEat();
  renderPoop();
}

// 渲染饮食表格
function renderEat() {
  eatForm1.innerHTML = "";
  eatForm2.innerHTML = "";
  eatListCache.forEach(item => {
    const html = `
        <tr>
            <td>${item.eatTime}</td>
            <td>${item.food}</td>
            <td>${item.weather}</td>
            <td>${item.mood}</td>
        </tr>
    `
    if (item.dogId === dogListCache[0]?.id) eatForm1.innerHTML += html;
    if (item.dogId === dogListCache[1]?.id) eatForm2.innerHTML += html;
  })
}

// 渲染排便表格
function renderPoop() {
  poopForm1.innerHTML = "";
  poopForm2.innerHTML = "";
  poopListCache.forEach(item => {
    const html = `
        <tr>
            <td>${item.poopTime}</td>
            <td>${item.poopDesc}</td>
            <td>${item.weather}</td>
            <td>${item.mood}</td>
        </tr>
    `
    if (item.dogId === dogListCache[0]?.id) poopForm1.innerHTML += html;
    if (item.dogId === dogListCache[1]?.id) poopForm2.innerHTML += html;
  })
}

// 新增饮食提交
document.getElementById('submitEat').addEventListener('click', async function () {
  const dogId = document.getElementById('eatDogId').value;
  const food = document.getElementById('eatFood').value.trim();
  const weather = document.getElementById('eatWeather').value;
  const mood = document.getElementById('eatMood').value;
  const eatTime = document.getElementById('eatTime').value;
  if (!food || !eatTime) return alert('饮食内容、时间必填');
  const res = await request('/api/eat/add', {
    method: 'POST',
    body: JSON.stringify({ dogId, food, weather, mood, eatTime })
  })
  if (res.code === 200) {
    alert('添加成功');
    await renderAll();
    document.getElementById('eatFormBox').reset();
  }
})

// 新增排便提交
document.getElementById('submitPoop').addEventListener('click', async function () {
  const dogId = document.getElementById('poopDogId').value;
  const poopDesc = document.getElementById('poopInfo').value.trim();
  const weather = document.getElementById('poopWeather').value;
  const mood = document.getElementById('poopMood').value;
  const poopTime = document.getElementById('poopTime').value;
  if (!poopDesc || !poopTime) return alert('排便描述、时间必填');
  const res = await request('/api/poop/add', {
    method: 'POST',
    body: JSON.stringify({ dogId, poopDesc, weather, mood, poopTime })
  })
  if (res.code === 200) {
    alert('添加成功');
    await renderAll();
    document.getElementById('poopFormBox').reset();
  }
})

// 退出登录
document.getElementById('logoutBtn').addEventListener('click', function () {
  localStorage.clear();
  sessionStorage.clear();
  location.href = "login.html";
})

// 弹窗关闭
closeModalBtn.addEventListener('click', () => modal.style.display = 'none')
window.onclick = function (e) {
  if (e.target === modal) modal.style.display = 'none'
}