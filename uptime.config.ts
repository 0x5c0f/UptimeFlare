const pageConfig = {
  // Title for your status page
  title: "0x5c0f's Status Page",
  // Links shown at the header of your status page, could set `highlight` to `true`
  links: [
    { link: 'https://github.com/0x5c0f', label: 'GitHub' },
    { link: 'https://blog.0x5c0f.cc', label: 'Blog' },
    { link: 'mailto:mail@0x5c0f.cc', label: 'Email Me', highlight: true },
  ],
}

const workerConfig = {
  // Write KV at most every 3 minutes unless the status changed.
  kvWriteCooldownMinutes: 3,
  // Define all your monitors here
  monitors: [
    // Example HTTP Monitor
    {
      id: 'tools',
      name: '主页',
      method: 'GET',
      target: 'https://tools.0x5c0f.cc',
      // 鼠标移动上去后显示的内容
      tooltip: '个人主页(Aliyun) - https://tools.0x5c0f.cc',
      // 状态页面可以点击的地址
      statusPageLink: 'https://tools.0x5c0f.cc',
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare for Cloudflare',
        // Authorization: 'Bearer YOUR_TOKEN_HERE',
      },
      // [OPTIONAL] body to be sent
      // body: 'for cloudflare',
      // 响应什么内容才代表请求成功
      // responseKeyword: 'success'
    },
    {
      id: 'blog',
      name: '博客',
      method: 'GET',
      target: 'https://blog.0x5c0f.cc',
      tooltip: '博客(Aliyun & Vercel) - https://blog.0x5c0f.cc',
      statusPageLink: 'https://blog.0x5c0f.cc',
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare for Cloudflare',
      },
    },
    {
      id: 'waline',
      name: 'Waline 评论系统',
      method: 'GET',
      target: 'https://talk.51ac.cc',
      tooltip: 'Waline 评论系统(Vercel 自建) - https://talk.51ac.cc',
      statusPageLink: 'https://talk.51ac.cc',
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare for Cloudflare',
      },
    },
    {
      id: 'waline',
      name: 'tldraw 绘图',
      method: 'GET',
      target: 'https://tld.51ac.cc',
      tooltip: 'tldraw 绘图(Vercel 转发) - 官网: https://www.tldraw.com',
      statusPageLink: 'https://tld.51ac.cc',
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare for Cloudflare',
      },
    },
    {
      id: 'waline',
      name: 'Excalidraw+ 绘图',
      method: 'GET',
      target: 'https://ed.51ac.cc',
      tooltip: 'Excalidraw+ 绘图(Vercel 自建) - 官网: https://www.tldraw.com',
      statusPageLink: 'https://ed.51ac.cc',
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare for Cloudflare',
      },
    },
    {
      id: 'iptools',
      name: 'IP 工具箱',
      method: 'GET',
      target: 'https://ip.51ac.cc',
      tooltip: 'IP 工具箱(Vercel 自建) - https://ip.51ac.cc',
      statusPageLink: 'https://ip.51ac.cc',
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare for Cloudflare',
      },
    },
  ],
  callbacks: {
    onStatusChange: async (
      env: any,
      monitor: any,
      isUp: boolean,
      timeIncidentStart: number,
      timeNow: number,
      reason: string
    ) => {
      // This callback will be called when there's a status change for any monitor
      // Write any Typescript code here

      // By default, this sends Bark and Telegram notification on every status change if you setup Cloudflare env variables correctly.
      await notify(env, monitor, isUp, timeIncidentStart, timeNow, reason)
    },
    onIncident: async (
      env: any,
      monitor: any,
      timeIncidentStart: number,
      timeNow: number,
      reason: string
    ) => {
      // This callback will be called EVERY 1 MINTUE if there's an on-going incident for any monitor
      // Write any Typescript code here
    },
  },
}

// Below is code for sending Telegram & Bark notification
// You can safely ignore them
const escapeMarkdown = (text: string) => {
  return text.replace(/[_*[\](){}~`>#+\-=|.!\\]/g, '\\$&');
};

async function notify(
  env: any,
  monitor: any,
  isUp: boolean,
  timeIncidentStart: number,
  timeNow: number,
  reason: string,
) {
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });

  let downtimeDuration = Math.round((timeNow - timeIncidentStart) / 60);
  const timeIncidentStartFormatted = dateFormatter.format(new Date(timeIncidentStart * 1000));
  let statusText = isUp
    ? `The service is up again after being down for ${downtimeDuration} minutes.`
    : `Service became unavailable at ${timeIncidentStartFormatted}. Issue: ${reason || 'unspecified'}`;

  console.log('Notifying: ', monitor.name, statusText);

  if (env.BARK_SERVER && env.BARK_DEVICE_KEY) {
    try {
      let title = isUp ? `✅ ${monitor.name} is up again!` : `🔴 ${monitor.name} is currently down.`;
      await sendBarkNotification(env, monitor, title, statusText);
    } catch (error) {
      console.error('Error sending Bark notification:', error);
    }
  }

  if (env.SECRET_TELEGRAM_CHAT_ID && env.SECRET_TELEGRAM_API_TOKEN) {
    try {
      let operationalLabel = isUp ? 'Up' : 'Down';
      let statusEmoji = isUp ? '✅' : '🔴';
      let telegramText = `*${escapeMarkdown(
        monitor.name,
      )}* is currently *${operationalLabel}*\n${statusEmoji} ${escapeMarkdown(statusText)}`;
      await notifyTelegram(env, monitor, isUp, telegramText);
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  }
}

export async function notifyTelegram(env: any, monitor: any, operational: boolean, text: string) {
  const chatId = env.SECRET_TELEGRAM_CHAT_ID;
  const apiToken = env.SECRET_TELEGRAM_API_TOKEN;

  const payload = new URLSearchParams({
    chat_id: chatId,
    parse_mode: 'MarkdownV2',
    text: text,
  });

  try {
    const response = await fetch(`https://api.telegram.org/bot${apiToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      console.error(
        `Failed to send Telegram notification "${text}",  ${response.status} ${response.statusText
        } ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

async function sendBarkNotification(env: any, monitor: any, title: string, body: string, group: string = '') {
  const barkServer = env.BARK_SERVER;
  const barkDeviceKey = env.BARK_DEVICE_KEY;
  const barkUrl = `${barkServer}/push`;
  const data = {
    title: title,
    body: body,
    group: group,
    url: monitor.url,
    device_key: barkDeviceKey,
  };

  const response = await fetch(barkUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    console.log('Bark notification sent successfully.');
  } else {
    const respText = await response.text();
    console.error('Failed to send Bark notification:', response.status, response.statusText, respText);
  }
}

// Don't forget this, otherwise compilation fails.
export { pageConfig, workerConfig }
