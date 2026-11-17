// Auto-generated from original index.js by scripts/extract-rules.ts
import type { Rule } from './types';

export const API_RENAME_MAP: Record<string, string> = {
  "login": "getAuthCode",
  "getUserProfile": "getOpenUserInfo"
};

export const PARAM_RENAME_MAP: Record<string, Record<string, string>> = {};

export const CONTEXT_MANAGERS: Record<string, string> = {
  getRecorderManager: 'RecorderManager',
  getFileSystemManager: 'FileSystemManager',
  downloadFile: 'DownloadTask',
  createCameraContext: 'CameraContext',
  createVideoContext: 'VideoContext',
  createAudioContext: 'AudioContext',
  createSelectorQuery: 'SelectorQuery',
  createMapContext: 'MapContext',
  getUpdateManager: 'UpdateManager',
};

export const apis = {
  "canIUse": {
    "status": 0,
    "desc": "判断小程序的 API，回调，参数，组件等是否在当前版本可用",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wx.canIUse.html",
      "target": ""
    },
    "body": {}
  },
  "getSystemSetting": {
    "status": 0,
    "desc": "获取设备设置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemSetting.html",
      "target": ""
    },
    "body": {}
  },
  "getSystemInfoSync": {
    "status": 1,
    "desc": "获取系统信息同步版本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wx.getSystemInfoSync.html",
      "target": ""
    },
    "body": {
      "msg": "返回值缺失",
      "returnValue": {
        "props": {
          "version": {
            "type": 0,
            "desc": "微信版本号"
          },
          "platform": {
            "type": 0,
            "desc": "客户端平台"
          },
          "fontSizeSetting": {
            "type": 0,
            "desc": "用户字体大小（单位px）。以微信客户端「我 - 设置 - 通用 - 字体大小」中的设置为准"
          },
          "SDKVersion": {
            "type": 0,
            "desc": "客户端基础库版本"
          },
          "benchmarkLevel": {
            "type": 0,
            "desc": "设备性能等级（仅 Android）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50）"
          },
          "albumAuthorized": {
            "type": 0,
            "desc": "允许微信使用相册的开关（仅 iOS 有效）"
          },
          "cameraAuthorized": {
            "type": 0,
            "desc": "允许微信使用摄像头的开关"
          },
          "locationAuthorized": {
            "type": 0,
            "desc": "允许微信使用定位的开关"
          },
          "microphoneAuthorized": {
            "type": 0,
            "desc": "允许微信使用麦克风的开关"
          },
          "notificationAuthorized": {
            "type": 0,
            "desc": "允许微信通知的开关"
          },
          "notificationAlertAuthorized": {
            "type": 0,
            "desc": "允许微信通知带有提醒的开关（仅 iOS 有效）"
          },
          "notificationBadgeAuthorized": {
            "type": 0,
            "desc": "允许微信通知带有标记的开关（仅 iOS 有效）"
          },
          "notificationSoundAuthorized": {
            "type": 0,
            "desc": "允许微信通知带有声音的开关（仅 iOS 有效）"
          },
          "phoneCalendarAuthorized": {
            "type": 0,
            "desc": "允许微信使用日历的开关"
          },
          "bluetoothEnabled": {
            "type": 0,
            "desc": "蓝牙的系统开关"
          },
          "locationEnabled": {
            "type": 0,
            "desc": "地理位置的系统开关"
          },
          "wifiEnabled": {
            "type": 0,
            "desc": "Wi-Fi 的系统开关"
          },
          "safeArea": {
            "type": 0,
            "desc": "在竖屏正方向下的安全区域"
          },
          "locationReducedAccuracy": {
            "type": 0,
            "desc": "系统当前主题，取值为light或dark，全局配置darkmode:true时才能获取，否则为 undefined （不支持小游戏）"
          },
          "host": {
            "type": 0,
            "desc": "当前小程序运行的宿主环境"
          },
          "enableDebug": {
            "type": 0,
            "desc": "是否已打开调试。可通过右上角菜单或 wx.setEnableDebug 打开调试。"
          },
          "deviceOrientation": {
            "type": 0,
            "desc": "设备方向"
          }
        }
      }
    }
  },
  "getSystemInfo": {
    "status": 1,
    "desc": "获取系统信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/system/system-info/wx.getSystemInfo.html",
      "target": ""
    },
    "body": {
      "msg": "返回值缺失",
      "returnValue": {
        "props": {
          "version": {
            "type": 0,
            "desc": "微信版本号"
          },
          "platform": {
            "type": 0,
            "desc": "客户端平台"
          },
          "fontSizeSetting": {
            "type": 0,
            "desc": "用户字体大小（单位px）。以微信客户端「我 - 设置 - 通用 - 字体大小」中的设置为准"
          },
          "SDKVersion": {
            "type": 0,
            "desc": "客户端基础库版本"
          },
          "benchmarkLevel": {
            "type": 0,
            "desc": "设备性能等级（仅 Android）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50）"
          },
          "albumAuthorized": {
            "type": 0,
            "desc": "允许微信使用相册的开关（仅 iOS 有效）"
          },
          "cameraAuthorized": {
            "type": 0,
            "desc": "允许微信使用摄像头的开关"
          },
          "locationAuthorized": {
            "type": 0,
            "desc": "允许微信使用定位的开关"
          },
          "microphoneAuthorized": {
            "type": 0,
            "desc": "允许微信使用麦克风的开关"
          },
          "notificationAuthorized": {
            "type": 0,
            "desc": "允许微信通知的开关"
          },
          "notificationAlertAuthorized": {
            "type": 0,
            "desc": "允许微信通知带有提醒的开关（仅 iOS 有效）"
          },
          "notificationBadgeAuthorized": {
            "type": 0,
            "desc": "允许微信通知带有标记的开关（仅 iOS 有效）"
          },
          "notificationSoundAuthorized": {
            "type": 0,
            "desc": "允许微信通知带有声音的开关（仅 iOS 有效）"
          },
          "phoneCalendarAuthorized": {
            "type": 0,
            "desc": "允许微信使用日历的开关"
          },
          "bluetoothEnabled": {
            "type": 0,
            "desc": "蓝牙的系统开关"
          },
          "locationEnabled": {
            "type": 0,
            "desc": "地理位置的系统开关"
          },
          "wifiEnabled": {
            "type": 0,
            "desc": "Wi-Fi 的系统开关"
          },
          "safeArea": {
            "type": 0,
            "desc": "在竖屏正方向下的安全区域"
          },
          "locationReducedAccuracy": {
            "type": 0,
            "desc": "系统当前主题，取值为light或dark，全局配置darkmode:true时才能获取，否则为 undefined （不支持小游戏）"
          },
          "host": {
            "type": 0,
            "desc": "当前小程序运行的宿主环境"
          },
          "enableDebug": {
            "type": 0,
            "desc": "是否已打开调试。可通过右上角菜单或 wx.setEnableDebug 打开调试。"
          },
          "deviceOrientation": {
            "type": 0,
            "desc": "设备方向"
          }
        }
      }
    }
  },
  "getUpdateManager": {
    "status": 0,
    "desc": "获取全局唯一的版本更新管理器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/wx.getUpdateManager.html",
      "target": ""
    },
    "body": {}
  },
  "getLaunchOptionsSync": {
    "status": 1,
    "desc": "获取小程序启动时的参数",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html",
      "target": ""
    },
    "body": {
      "msg": "返回值缺失",
      "returnValue": {
        "props": {
          "path": {
            "type": 0,
            "desc": "启动小程序的路径"
          },
          "scene": {
            "type": 0,
            "desc": "启动小程序的场景值"
          },
          "query": {
            "type": 0,
            "desc": "启动小程序的 query 参数"
          },
          "shareTicket": {
            "type": 0,
            "desc": "shareTicket"
          },
          "referrerInfo": {
            "type": 0,
            "desc": "来源信息"
          },
          "forwardMaterials": {
            "type": 0,
            "desc": "打开的文件信息数组"
          },
          "chatType": {
            "type": 0,
            "desc": "群聊/单聊类型"
          },
          "apiCategory": {
            "type": 0,
            "desc": "API 类别"
          }
        }
      }
    }
  },
  "onPageNotFound": {
    "status": 2,
    "desc": "监听小程序要打开的页面不存在事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onPageNotFound.html",
      "target": ""
    },
    "body": {}
  },
  "onError": {
    "status": 0,
    "desc": "监听小程序错误事件。如脚本错误或 API 调用报错等。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onError.html",
      "target": ""
    },
    "body": {}
  },
  "onAudioInterruptionBegin": {
    "status": 2,
    "desc": "监听音频因为受到系统占用而被中断开始事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAudioInterruptionBegin.html",
      "target": ""
    },
    "body": {}
  },
  "onAudioInterruptionEnd": {
    "status": 2,
    "desc": "监听音频中断结束事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAudioInterruptionEnd.html",
      "target": ""
    },
    "body": {}
  },
  "onAppShow": {
    "status": 0,
    "desc": "监听小程序切前台事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppShow.html",
      "target": ""
    },
    "body": {}
  },
  "onAppHide": {
    "status": 0,
    "desc": "监听小程序切后台事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppHide.html",
      "target": ""
    },
    "body": {}
  },
  "offPageNotFound": {
    "status": 2,
    "desc": "取消监听小程序要打开的页面不存在事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offPageNotFound.html",
      "target": ""
    },
    "body": {}
  },
  "offError": {
    "status": 0,
    "desc": "监听小程序切前台事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offError.html",
      "target": ""
    },
    "body": {}
  },
  "offAudioInterruptionBegin": {
    "status": 2,
    "desc": "取消监听音频因为受到系统占用而被中断开始事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAudioInterruptionBegin.html",
      "target": ""
    },
    "body": {}
  },
  "offAudioInterruptionEnd": {
    "status": 2,
    "desc": "取消监听音频中断结束事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAudioInterruptionEnd.html",
      "target": ""
    },
    "body": {}
  },
  "offAppShow": {
    "status": 0,
    "desc": "取消监听小程序切前台事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAppShow.html",
      "target": ""
    },
    "body": {}
  },
  "offAppHide": {
    "status": 0,
    "desc": "取消监听小程序切后台事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAppHide.html",
      "target": ""
    },
    "body": {}
  },
  "setEnableDebug": {
    "status": 2,
    "desc": "设置是否打开调试开关。此开关对正式版也能生效",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.setEnableDebug.html",
      "target": ""
    },
    "body": {}
  },
  "getLogManager": {
    "status": 2,
    "desc": "获取日志管理器对象。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.getLogManager.html",
      "target": ""
    },
    "body": {}
  },
  "base64ToArrayBuffer": {
    "status": 0,
    "desc": "将 Base64 字符串转成 ArrayBuffer 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.base64ToArrayBuffer.html",
      "target": ""
    },
    "body": {}
  },
  "arrayBufferToBase64": {
    "status": 0,
    "desc": "将 ArrayBuffer 字符串转成 Base64 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.arrayBufferToBase64.html",
      "target": ""
    },
    "body": {}
  },
  "updateWeChatApp": {
    "status": 2,
    "desc": "更新客户端版本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/wx.updateWeChatApp.html",
      "target": ""
    },
    "body": {}
  },
  "getEnterOptionsSync": {
    "status": 2,
    "desc": "获取本次小程序启动时的参数",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getEnterOptionsSync.html",
      "target": ""
    },
    "body": {}
  },
  "onUnhandledRejection": {
    "status": 2,
    "desc": "监听未处理的 Promise 拒绝事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html",
      "target": ""
    },
    "body": {}
  },
  "onThemeChange": {
    "status": 2,
    "desc": "监听系统主题改变事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onThemeChange.html",
      "target": ""
    },
    "body": {}
  },
  "offUnhandledRejection": {
    "status": 2,
    "desc": "取消监听未处理的 Promise 拒绝事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offUnhandledRejection.html",
      "target": ""
    },
    "body": {}
  },
  "offThemeChange": {
    "status": 2,
    "desc": "取消监听系统主题改变事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offThemeChange.html",
      "target": ""
    },
    "body": {}
  },
  "getRealtimeLogManager": {
    "status": 2,
    "desc": "获取实时日志管理器对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.getRealtimeLogManager.html",
      "target": ""
    },
    "body": {}
  },
  "UpdateManager.applyUpdate": {
    "status": 0,
    "desc": "强制小程序重启并使用新版本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.applyUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "UpdateManager.onCheckForUpdate": {
    "status": 0,
    "desc": "监听后台请求检查更新结果事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.onCheckForUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "UpdateManager.onUpdateReady": {
    "status": 0,
    "desc": "监听小程序有版本更新事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.onUpdateReady.html",
      "target": ""
    },
    "body": {}
  },
  "UpdateManager.onUpdateFailed": {
    "status": 0,
    "desc": "监听小程序更新失败事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.onUpdateFailed.html",
      "target": ""
    },
    "body": {}
  },
  "createCanvasContext": {
    "status": 2,
    "desc": "创建 canvas 的绘图上下文 CanvasContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html",
      "target": ""
    },
    "body": {}
  },
  "canvasToTempFilePath": {
    "status": 2,
    "desc": "把当前画布指定区域的内容导出生成指定大小的图片",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasToTempFilePath.html",
      "target": ""
    },
    "body": {}
  },
  "canvasPutImageData": {
    "status": 2,
    "desc": "将像素数据绘制到画布",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasPutImageData.html",
      "target": ""
    },
    "body": {}
  },
  "canvasGetImageData": {
    "status": 2,
    "desc": "获取 canvas 区域隐含的像素数据。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasGetImageData.html",
      "target": ""
    },
    "body": {}
  },
  "createOffscreenCanvas": {
    "status": 2,
    "desc": "创建离屏 canvas 实例",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createOffscreenCanvas.html",
      "target": ""
    },
    "body": {}
  },
  "stopBeaconDiscovery": {
    "status": 2,
    "desc": "停止搜索附近的 iBeacon 设备",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.stopBeaconDiscovery.html",
      "target": ""
    },
    "body": {}
  },
  "startBeaconDiscovery": {
    "status": 2,
    "desc": "开始搜索附近的 iBeacon 设备",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.startBeaconDiscovery.html",
      "target": ""
    },
    "body": {}
  },
  "onBeaconUpdate": {
    "status": 2,
    "desc": "监听 iBeacon 设备更新事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.onBeaconUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "onBeaconServiceChange": {
    "status": 2,
    "desc": "监听 iBeacon 服务状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.onBeaconServiceChange.html",
      "target": ""
    },
    "body": {}
  },
  "getBeacons": {
    "status": 2,
    "desc": "获取所有已搜索到的 iBeacon 设备",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.getBeacons.html",
      "target": ""
    },
    "body": {}
  },
  "stopWifi": {
    "status": 2,
    "desc": "关闭 Wi-Fi 模块",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.stopWifi.html",
      "target": ""
    },
    "body": {}
  },
  "startWifi": {
    "status": 2,
    "desc": "初始化 Wi-Fi 模块",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.startWifi.html",
      "target": ""
    },
    "body": {}
  },
  "setWifiList": {
    "status": 2,
    "desc": "设置 wifiList 中 AP 的相关信息。在 onGetWifiList 回调后调用，iOS特有接口",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.setWifiList.html",
      "target": ""
    },
    "body": {}
  },
  "onWifiConnected": {
    "status": 2,
    "desc": "监听连接上 Wi-Fi 的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.onWifiConnected.html",
      "target": ""
    },
    "body": {}
  },
  "onGetWifiList": {
    "status": 2,
    "desc": "监听获取到 Wi-Fi 列表数据事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.onGetWifiList.html",
      "target": ""
    },
    "body": {}
  },
  "getWifiList": {
    "status": 2,
    "desc": "监听连接上 Wi-Fi 的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.getWifiList.html",
      "target": ""
    },
    "body": {}
  },
  "getConnectedWifi": {
    "status": 2,
    "desc": "监听连接上 Wi-Fi 的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.getConnectedWifi.html",
      "target": ""
    },
    "body": {}
  },
  "connectWifi": {
    "status": 2,
    "desc": "连接 Wi-Fi。若已知 Wi-Fi 信息，可以直接利用该接口连接",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.connectWifi.html",
      "target": ""
    },
    "body": {}
  },
  "writeBLECharacteristicValue": {
    "status": 0,
    "desc": "读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持 read 才可以成功调用",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.writeBLECharacteristicValue.html",
      "target": ""
    },
    "body": {}
  },
  "readBLECharacteristicValue": {
    "status": 2,
    "desc": "读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持 read 才可以成功调用",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.readBLECharacteristicValue.html",
      "target": ""
    },
    "body": {}
  },
  "onBLEConnectionStateChange": {
    "status": 2,
    "desc": "监听低功耗蓝牙连接状态的改变事件。包括开发者主动连接或断开连接，设备丢失，连接异常断开等等",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLEConnectionStateChange.html",
      "target": ""
    },
    "body": {}
  },
  "onBLECharacteristicValueChange": {
    "status": 2,
    "desc": "监听低功耗蓝牙设备的特征值变化事件。必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLECharacteristicValueChange.html",
      "target": ""
    },
    "body": {}
  },
  "notifyBLECharacteristicValueChange": {
    "status": 2,
    "desc": "监听低功耗蓝牙设备的特征值变化事件。必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLECharacteristicValueChange.html",
      "target": ""
    },
    "body": {}
  },
  "getBLEDeviceServices": {
    "status": 0,
    "desc": "获取蓝牙设备所有服务",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceServices.html",
      "target": ""
    },
    "body": {}
  },
  "getBLEDeviceCharacteristics": {
    "status": 0,
    "desc": "获取蓝牙设备某个服务中所有特征值",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceCharacteristics.html",
      "target": ""
    },
    "body": {}
  },
  "createBLEConnection": {
    "status": 0,
    "desc": "连接低功耗蓝牙设备。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.createBLEConnection.html",
      "target": ""
    },
    "body": {}
  },
  "closeBLEConnection": {
    "status": 0,
    "desc": "断开与低功耗蓝牙设备的连接。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.closeBLEConnection.html",
      "target": ""
    },
    "body": {}
  },
  "addPhoneContact": {
    "status": 2,
    "desc": "添加手机通讯录联系人。用户可以选择将该表单以「新增联系人」或「添加到已有联系人」的方式，写入手机系统通讯录。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/contact/wx.addPhoneContact.html",
      "target": ""
    },
    "body": {}
  },
  "chooseContact": {
    "status": 0,
    "desc": "添加手机通讯录联系人。用户可以选择将该表单以「新增联系人」或「添加到已有联系人」的方式，写入手机系统通讯录。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/contact/wx.chooseContact.html",
      "target": ""
    },
    "body": {}
  },
  "stopBluetoothDevicesDiscovery": {
    "status": 0,
    "desc": "停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.stopBluetoothDevicesDiscovery.html",
      "target": ""
    },
    "body": {}
  },
  "startBluetoothDevicesDiscovery": {
    "status": 1,
    "desc": "开始搜寻附近的蓝牙外围设备",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.startBluetoothDevicesDiscovery.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "allowDuplicatesKey": {
            "type": 0,
            "desc": "是否允许重复上报同一设备"
          },
          "interval": {
            "type": 0,
            "desc": "上报设备的间隔"
          },
          "powerLevel": {
            "type": 0,
            "desc": "扫描模式，越高扫描越快，也越耗电。"
          }
        }
      }
    }
  },
  "openBluetoothAdapter": {
    "status": 1,
    "desc": "初始化蓝牙模块",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.openBluetoothAdapter.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "mode": {
            "type": 0,
            "desc": "蓝牙模式，可作为主/从设备，仅 iOS 需要。"
          }
        }
      }
    }
  },
  "offBluetoothDeviceFound": {
    "status": 0,
    "desc": "移除搜索到新设备的事件的全部监听函数",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.offBluetoothDeviceFound.html",
      "target": ""
    },
    "body": {}
  },
  "onBluetoothDeviceFound": {
    "status": 0,
    "desc": "监听寻找到新设备的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothDeviceFound.html",
      "target": ""
    },
    "body": {}
  },
  "onBluetoothAdapterStateChange": {
    "status": 2,
    "desc": "监听蓝牙适配器状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothAdapterStateChange.html",
      "target": ""
    },
    "body": {}
  },
  "getConnectedBluetoothDevices": {
    "status": 2,
    "desc": "根据 uuid 获取处于已连接状态的设备",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getConnectedBluetoothDevices.html",
      "target": ""
    },
    "body": {}
  },
  "getBluetoothDevices": {
    "status": 2,
    "desc": "获取在蓝牙模块生效期间所有已发现的蓝牙设备。包括已经和本机处于连接状态的设备。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getBluetoothDevices.html",
      "target": ""
    },
    "body": {}
  },
  "getBluetoothAdapterState": {
    "status": 2,
    "desc": "获取本机蓝牙适配器状态。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getBluetoothAdapterState.html",
      "target": ""
    },
    "body": {}
  },
  "closeBluetoothAdapter": {
    "status": 0,
    "desc": "关闭蓝牙模块。调用该方法将断开所有已建立的连接并释放系统资源",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.closeBluetoothAdapter.html",
      "target": ""
    },
    "body": {}
  },
  "getBatteryInfoSync": {
    "status": 2,
    "desc": "wx.getBatteryInfo 的同步版本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/battery/wx.getBatteryInfoSync.html",
      "target": ""
    },
    "body": {}
  },
  "getBatteryInfo": {
    "status": 0,
    "desc": "获取设备电量。同步 API wx.getBatteryInfoSync 在 iOS 上不可用",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/battery/wx.getBatteryInfo.html",
      "target": ""
    },
    "body": {}
  },
  "stopHCE": {
    "status": 2,
    "desc": "关闭 NFC 模块。仅在安卓系统下有效",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.stopHCE.html",
      "target": ""
    },
    "body": {}
  },
  "startHCE": {
    "status": 2,
    "desc": "初始化 NFC 模块。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.startHCE.html",
      "target": ""
    },
    "body": {}
  },
  "sendHCEMessage": {
    "status": 2,
    "desc": "发送 NFC 消息。仅在安卓系统下有效。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.sendHCEMessage.html",
      "target": ""
    },
    "body": {}
  },
  "onHCEMessage": {
    "status": 2,
    "desc": "监听接收 NFC 设备消息事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.onHCEMessage.html",
      "target": ""
    },
    "body": {}
  },
  "getHCEState": {
    "status": 2,
    "desc": "判断当前设备是否支持 HCE 能力",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.getHCEState.html",
      "target": ""
    },
    "body": {}
  },
  "onNetworkStatusChange": {
    "status": 0,
    "desc": "监听网络状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.onNetworkStatusChange.html",
      "target": ""
    },
    "body": {}
  },
  "getNetworkType": {
    "status": 0,
    "desc": "获取网络类型",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.getNetworkType.html",
      "target": ""
    },
    "body": {}
  },
  "setScreenBrightness": {
    "status": 0,
    "desc": "设置屏幕亮度",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setScreenBrightness.html",
      "target": ""
    },
    "body": {}
  },
  "setKeepScreenOn": {
    "status": 0,
    "desc": "设置是否保持常亮状态。仅在当前小程序生效，离开小程序后设置失效。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setKeepScreenOn.html",
      "target": ""
    },
    "body": {}
  },
  "onUserCaptureScreen": {
    "status": 2,
    "desc": "监听用户主动截屏事件。用户使用系统截屏按键截屏时触发",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.onUserCaptureScreen.html",
      "target": ""
    },
    "body": {}
  },
  "getScreenBrightness": {
    "status": 0,
    "desc": "获取屏幕亮度",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.getScreenBrightness.html",
      "target": ""
    },
    "body": {}
  },
  "makePhoneCall": {
    "status": 0,
    "desc": "拨打电话",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/phone/wx.makePhoneCall.html",
      "target": ""
    },
    "body": {}
  },
  "onAccelerometerChange": {
    "status": 2,
    "desc": "监听加速度数据事件。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.onAccelerometerChange.html",
      "target": ""
    },
    "body": {}
  },
  "startAccelerometer": {
    "status": 2,
    "desc": "开始监听罗盘数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.startAccelerometer.html",
      "target": ""
    },
    "body": {}
  },
  "stopAccelerometer": {
    "status": 2,
    "desc": "停止监听加速度数据。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.stopAccelerometer.html",
      "target": ""
    },
    "body": {}
  },
  "onCompassChange": {
    "status": 2,
    "desc": "监听罗盘数据变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/compass/wx.onCompassChange.html",
      "target": ""
    },
    "body": {}
  },
  "startCompass": {
    "status": 2,
    "desc": "开始监听罗盘数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/compass/wx.startCompass.html",
      "target": ""
    },
    "body": {}
  },
  "stopCompass": {
    "status": 2,
    "desc": "停止监听罗盘数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/compass/wx.stopCompass.html",
      "target": ""
    },
    "body": {}
  },
  "onDeviceMotionChange": {
    "status": 2,
    "desc": "监听设备方向变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.onDeviceMotionChange.html",
      "target": ""
    },
    "body": {}
  },
  "startDeviceMotionListening": {
    "status": 2,
    "desc": "开始监听设备方向的变化",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.startDeviceMotionListening.html",
      "target": ""
    },
    "body": {}
  },
  "stopDeviceMotionListening": {
    "status": 2,
    "desc": "停止监听设备方向的变化",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.stopDeviceMotionListening.html",
      "target": ""
    },
    "body": {}
  },
  "onGyroscopeChange": {
    "status": 0,
    "desc": "监听陀螺仪数据变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.onGyroscopeChange.html",
      "target": ""
    },
    "body": {}
  },
  "offGyroscopeChange": {
    "status": 0,
    "desc": "监听陀螺仪数据变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.offGyroscopeChange.html",
      "target": ""
    },
    "body": {}
  },
  "startGyroscope": {
    "status": 0,
    "desc": "开始监听陀螺仪数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.startGyroscope.html",
      "target": ""
    },
    "body": {}
  },
  "stopGyroscope": {
    "status": 0,
    "desc": "停止监听陀螺仪数据。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.stopGyroscope.html",
      "target": ""
    },
    "body": {}
  },
  "onMemoryWarning": {
    "status": 0,
    "desc": "监听内存不足告警事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/performance/wx.onMemoryWarning.html",
      "target": ""
    },
    "body": {}
  },
  "scanCode": {
    "status": 0,
    "desc": "调起客户端扫码界面进行扫码",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/scan/wx.scanCode.html",
      "target": ""
    },
    "body": {}
  },
  "vibrateLong": {
    "status": 0,
    "desc": "使手机发生较长时间的振动",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/vibrate/wx.vibrateLong.html",
      "target": ""
    },
    "body": {}
  },
  "vibrateShort": {
    "status": 0,
    "desc": "使手机发生较长时间的振动",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/vibrate/wx.vibrateShort.html",
      "target": ""
    },
    "body": {}
  },
  "onBLEPeripheralConnectionStateChanged": {
    "status": 2,
    "desc": "监听当前外围设备被连接或断开连接事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-peripheral/wx.onBLEPeripheralConnectionStateChanged.html",
      "target": ""
    },
    "body": {}
  },
  "offBLEPeripheralConnectionStateChanged": {
    "status": 2,
    "desc": "取消监听当前外围设备被连接或断开连接事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-peripheral/wx.offBLEPeripheralConnectionStateChanged.html",
      "target": ""
    },
    "body": {}
  },
  "createBLEPeripheralServer": {
    "status": 2,
    "desc": "建立本地作为外围设备的服务端，可创建多个",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-peripheral/wx.createBLEPeripheralServer.html",
      "target": ""
    },
    "body": {}
  },
  "offHCEMessage": {
    "status": 2,
    "desc": "接收 NFC 设备消息事件，取消事件监听",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.offHCEMessage.html",
      "target": ""
    },
    "body": {}
  },
  "getNFCAdapter": {
    "status": 2,
    "desc": "获取 NFC 实例",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.getNFCAdapter.html",
      "target": ""
    },
    "body": {}
  },
  "offWifiConnected": {
    "status": 2,
    "desc": "取消监听连接上 Wi-Fi 的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.offWifiConnected.html",
      "target": ""
    },
    "body": {}
  },
  "offGetWifiList": {
    "status": 2,
    "desc": "取消监听获取到 Wi-Fi 列表数据事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.offGetWifiList.html",
      "target": ""
    },
    "body": {}
  },
  "setBLEMTU": {
    "status": 2,
    "desc": "设置蓝牙最大传输单元",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.setBLEMTU.html",
      "target": ""
    },
    "body": {}
  },
  "offBLEConnectionStateChange": {
    "status": 2,
    "desc": "取消监听低功耗蓝牙连接状态的改变事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.offBLEConnectionStateChange.html",
      "target": ""
    },
    "body": {}
  },
  "offBLECharacteristicValueChange": {
    "status": 2,
    "desc": "取消监听低功耗蓝牙设备的特征值变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.offBLECharacteristicValueChange.html",
      "target": ""
    },
    "body": {}
  },
  "makeBluetoothPair": {
    "status": 2,
    "desc": "蓝牙配对接口，仅安卓使用",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.makeBluetoothPair.html",
      "target": ""
    },
    "body": {}
  },
  "getBLEDeviceRSSI": {
    "status": 2,
    "desc": "获取蓝牙设备的信号强度",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceRSSI.html",
      "target": ""
    },
    "body": {}
  },
  "checkIsOpenAccessibility": {
    "status": 2,
    "desc": "检测是否开启视觉无障碍功能",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/accessibility/wx.checkIsOpenAccessibility.html",
      "target": ""
    },
    "body": {}
  },
  "offBluetoothAdapterStateChange": {
    "status": 2,
    "desc": "取消监听蓝牙适配器状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.offBluetoothAdapterStateChange.html",
      "target": ""
    },
    "body": {}
  },
  "setClipboardData": {
    "status": 0,
    "desc": "设置系统剪贴板的内容",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.setClipboardData.html",
      "target": ""
    },
    "body": {}
  },
  "getClipboardData": {
    "status": 0,
    "desc": "获取系统剪贴板的内容",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.getClipboardData.html",
      "target": ""
    },
    "body": {}
  },
  "offNetworkStatusChange": {
    "status": 0,
    "desc": "取消监听网络状态变化事件，参数为空，则取消所有的事件监听",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.offNetworkStatusChange.html",
      "target": ""
    },
    "body": {}
  },
  "offUserCaptureScreen": {
    "status": 2,
    "desc": "用户主动截屏事件。取消事件监听",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.offUserCaptureScreen.html",
      "target": ""
    },
    "body": {}
  },
  "offDeviceMotionChange": {
    "status": 2,
    "desc": "取消监听设备方向变化事件，参数为空，则取消所有的事件监听",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.offDeviceMotionChange.html",
      "target": ""
    },
    "body": {}
  },
  "offMemoryWarning": {
    "status": 0,
    "desc": "取消监听内存不足告警事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/device/performance/wx.offMemoryWarning.html",
      "target": ""
    },
    "body": {}
  },
  "getExtConfig": {
    "status": 2,
    "desc": "获取第三方平台自定义的数据字段。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ext/wx.getExtConfig.html",
      "target": ""
    },
    "body": {}
  },
  "getExtConfigSync": {
    "status": 2,
    "desc": "wx.getExtConfig 的同步版本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ext/wx.getExtConfigSync.html",
      "target": ""
    },
    "body": {}
  },
  "saveFile": {
    "status": 0,
    "desc": "保存文件到本地",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.saveFile.html",
      "target": ""
    },
    "body": {}
  },
  "removeSavedFile": {
    "status": 0,
    "desc": "删除本地缓存文件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.removeSavedFile.html",
      "target": ""
    },
    "body": {}
  },
  "openDocument": {
    "status": 1,
    "desc": "新开页面打开文档",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.openDocument.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "showMenu": {
            "type": 0,
            "desc": "是否显示右上角菜单"
          }
        }
      }
    }
  },
  "getSavedFileList": {
    "status": 0,
    "desc": "获取保存的所有文件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileList.html",
      "target": ""
    },
    "body": {}
  },
  "getSavedFileInfo": {
    "status": 0,
    "desc": "获取保存的文件信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileInfo.html",
      "target": ""
    },
    "body": {}
  },
  "getFileSystemManager": {
    "status": 0,
    "desc": "获取全局唯一的文件管理器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getFileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "getFileInfo": {
    "status": 1,
    "desc": "获取文件信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.getFileInfo.html",
      "target": ""
    },
    "body": {
      "params": {
        "props": {
          "digestAlgorithm": {
            "type": 0,
            "desc": "alipay: md5, macle: sha256"
          }
        }
      }
    }
  },
  "saveFileToDisk": {
    "status": 2,
    "desc": "保存文件系统的文件到用户磁盘，仅在 PC 端支持",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.saveFileToDisk.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.removeSavedFile": {
    "status": 0,
    "desc": "删除本地缓存文件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.removeSavedFile.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.getSavedFileList": {
    "status": 0,
    "desc": "获取保存的所有文件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileList.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.getSavedFileInfo": {
    "status": 0,
    "desc": "获取保存的文件信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileInfo.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.getFileInfo": {
    "status": 1,
    "desc": "获取文件信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.getFileInfo.html",
      "target": ""
    },
    "body": {
      "params": {
        "props": {
          "digestAlgorithm": {
            "type": 4,
            "desc": "wx: md5, macle: sha256"
          }
        }
      }
    }
  },
  "FileSystemManager.access": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.accessSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.appendFile": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.appendFileSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.close": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.closeSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.copyFileSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.copyFile": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.fstat": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.fstatSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.ftruncate": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.ftruncateSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.mkdirSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.mkdir": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.open": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.openSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readFile": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readCompressedFile": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readCompressedFileSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readdirSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readdir": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.moveFile": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readFileSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.readZipEntry": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.rename": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.renameSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.rmdir": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.rmdirSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.saveFileSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.saveFile": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.stat": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.statSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.truncate": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.truncateSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.unlinkSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.unlink": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.unzip": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.writeFile": {
    "status": 0,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.writeFileSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "FileSystemManager.writeSync": {
    "status": 2,
    "desc": "fileSystemManager Operate",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
      "target": ""
    },
    "body": {}
  },
  "openLocation": {
    "status": 2,
    "desc": "打开位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.openLocation.html",
      "target": ""
    },
    "body": {}
  },
  "getLocation": {
    "status": 1,
    "desc": "获取位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html",
      "target": ""
    },
    "body": {
      "msg": "命名不同/参数差异/返回值差异",
      "params": {
        "props": {
          "type": {
            "type": 0,
            "desc": "wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标"
          },
          "altitude": {
            "type": 0,
            "desc": "传入 true 会返回高度信息，由于获取高度需要较高精确度，会减慢接口返回速度"
          },
          "isHighAccuracy": {
            "type": 0,
            "desc": "开启高精度定位"
          },
          "highAccuracyExpireTime": {
            "type": 0,
            "desc": "高精度定位超时时间(ms)，指定时间内返回最高精度，该值3000ms以上高精度定位才有效果"
          }
        }
      }
    }
  },
  "chooseLocation": {
    "status": 2,
    "desc": "打开地图选择位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html",
      "target": ""
    },
    "body": {}
  },
  "stopLocationUpdate": {
    "status": 2,
    "desc": "关闭监听实时位置变化，前后台都停止消息接收",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.stopLocationUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "startLocationUpdateBackground": {
    "status": 2,
    "desc": "开启小程序进入前后台时均接收位置消息，需引导用户开启授权",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.startLocationUpdateBackground.html",
      "target": ""
    },
    "body": {}
  },
  "startLocationUpdate": {
    "status": 2,
    "desc": "开启小程序进入前台时接收位置消息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.startLocationUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "onLocationChange": {
    "status": 2,
    "desc": "监听实时地理位置变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.onLocationChange.html",
      "target": ""
    },
    "body": {}
  },
  "offLocationChange": {
    "status": 2,
    "desc": "取消监听实时地理位置变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.offLocationChange.html",
      "target": ""
    },
    "body": {}
  },
  "createMapContext": {
    "status": 0,
    "desc": "创建 map 上下文 MapContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/wx.createMapContext.html",
      "target": ""
    },
    "body": {}
  },
  "saveImageToPhotosAlbum": {
    "status": 0,
    "desc": "保存图片到系统相册不支持网络图片路径",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.saveImageToPhotosAlbum.html",
      "target": ""
    },
    "body": {}
  },
  "previewImage": {
    "status": 1,
    "desc": "在新页面中全屏预览图片",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewImage.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "showmenu": {
            "type": 0,
            "desc": "是否显示长按菜单"
          },
          "referrerPolicy": {
            "type": 0,
            "desc": "origin: 发送完整的referrer; no-referrer: 不发送"
          }
        }
      }
    }
  },
  "getImageInfo": {
    "status": 0,
    "desc": "获取图片信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.getImageInfo.html",
      "target": ""
    },
    "body": {}
  },
  "compressImage": {
    "status": 1,
    "desc": "压缩图片接口，可选压缩质量",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.compressImage.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "compressedWidth": {
            "type": 0,
            "desc": "压缩后图片的宽度"
          },
          "compressedHeight": {
            "type": 0,
            "desc": "压缩后图片的高度"
          }
        }
      }
    }
  },
  "chooseMessageFile": {
    "status": 2,
    "desc": "从客户端会话选择文件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseMessageFile.html",
      "target": ""
    },
    "body": {}
  },
  "chooseImage": {
    "status": 0,
    "desc": "从本地相册选择图片或使用相机拍照",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseImage.html",
      "target": ""
    },
    "body": {}
  },
  "saveVideoToPhotosAlbum": {
    "status": 0,
    "desc": "保存视频到系统相册",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.saveVideoToPhotosAlbum.html",
      "target": ""
    },
    "body": {}
  },
  "createVideoContext": {
    "status": 0,
    "desc": "创建 video 上下文 VideoContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.createVideoContext.html",
      "target": ""
    },
    "body": {}
  },
  "chooseVideo": {
    "status": 1,
    "desc": "拍摄视频或从手机相册中选视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseVideo.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "compressed": {
            "type": 0,
            "desc": "是否压缩所选择的视频文件"
          },
          "maxDuration": {
            "type": 0,
            "desc": "拍摄视频最长拍摄时间，单位：秒"
          }
        }
      }
    }
  },
  "stopVoice": {
    "status": 0,
    "desc": "结束播放语音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.stopVoice.html",
      "target": ""
    },
    "body": {}
  },
  "setInnerAudioOption": {
    "status": 2,
    "desc": "设置 InnerAudioContext 的播放选项",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.setInnerAudioOption.html",
      "target": ""
    },
    "body": {}
  },
  "playVoice": {
    "status": 0,
    "desc": "开始播放语音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.playVoice.html",
      "target": ""
    },
    "body": {}
  },
  "pauseVoice": {
    "status": 2,
    "desc": "暂停正在播放的语音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.pauseVoice.html",
      "target": ""
    },
    "body": {}
  },
  "createInnerAudioContext": {
    "status": 2,
    "desc": "创建内部 audio 上下文 InnerAudioContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.createInnerAudioContext.html",
      "target": ""
    },
    "body": {}
  },
  "createAudioContext": {
    "status": 0,
    "desc": "创建 audio 上下文 AudioContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.createAudioContext.html",
      "target": ""
    },
    "body": {}
  },
  "stopBackgroundAudio": {
    "status": 2,
    "desc": "停止播放音乐",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.stopBackgroundAudio.html",
      "target": ""
    },
    "body": {}
  },
  "seekBackgroundAudio": {
    "status": 2,
    "desc": "控制音乐播放进度",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.seekBackgroundAudio.html",
      "target": ""
    },
    "body": {}
  },
  "playBackgroundAudio": {
    "status": 2,
    "desc": "使用后台播放器播放音乐",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.playBackgroundAudio.html",
      "target": ""
    },
    "body": {}
  },
  "pauseBackgroundAudio": {
    "status": 2,
    "desc": "暂停播放音乐",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.pauseBackgroundAudio.html",
      "target": ""
    },
    "body": {}
  },
  "onBackgroundAudioStop": {
    "status": 2,
    "desc": "监听音乐停止事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.onBackgroundAudioStop.html",
      "target": ""
    },
    "body": {}
  },
  "onBackgroundAudioPlay": {
    "status": 2,
    "desc": "监听音乐播放事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.onBackgroundAudioPlay.html",
      "target": ""
    },
    "body": {}
  },
  "onBackgroundAudioPause": {
    "status": 2,
    "desc": "监听音乐暂停事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.onBackgroundAudioPause.html",
      "target": ""
    },
    "body": {}
  },
  "getBackgroundAudioPlayerState": {
    "status": 2,
    "desc": "获取后台音乐播放状态",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.getBackgroundAudioPlayerState.html",
      "target": ""
    },
    "body": {}
  },
  "getBackgroundAudioManager": {
    "status": 2,
    "desc": "获取全局唯一的背景音频管理器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.getBackgroundAudioManager.html",
      "target": ""
    },
    "body": {}
  },
  "createLivePusherContext": {
    "status": 2,
    "desc": "创建 live-pusher 上下文 LivePusherContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/live/wx.createLivePusherContext.html",
      "target": ""
    },
    "body": {}
  },
  "createLivePlayerContext": {
    "status": 2,
    "desc": "创建 live-player 上下文 LivePlayerContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/live/wx.createLivePlayerContext.html",
      "target": ""
    },
    "body": {}
  },
  "stopRecord": {
    "status": 2,
    "desc": "停止录音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.stopRecord.html",
      "target": ""
    },
    "body": {}
  },
  "startRecord": {
    "status": 2,
    "desc": "开始录音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.startRecord.html",
      "target": ""
    },
    "body": {}
  },
  "getRecorderManager": {
    "status": 0,
    "desc": "获取全局唯一的录音管理器 RecorderManager",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
      "target": ""
    },
    "body": {}
  },
  "createCameraContext": {
    "status": 0,
    "desc": "创建 camera 上下文 CameraContext 对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/wx.createCameraContext.html",
      "target": ""
    },
    "body": {}
  },
  "previewMedia": {
    "status": 2,
    "desc": "预览图片和视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewMedia.html",
      "target": ""
    },
    "body": {}
  },
  "openVideoEditor": {
    "status": 2,
    "desc": "打开视频编辑器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.openVideoEditor.html",
      "target": ""
    },
    "body": {}
  },
  "getVideoInfo": {
    "status": 2,
    "desc": "获取视频详细信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.getVideoInfo.html",
      "target": ""
    },
    "body": {}
  },
  "compressVideo": {
    "status": 2,
    "desc": "压缩视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.compressVideo.html",
      "target": ""
    },
    "body": {}
  },
  "chooseMedia": {
    "status": 2,
    "desc": "拍摄或从手机相册中选择图片或视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html",
      "target": ""
    },
    "body": {}
  },
  "createMediaContainer": {
    "status": 2,
    "desc": "创建音视频处理容器，最终可将容器中的轨道合成一个视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video-processing/wx.createMediaContainer.html",
      "target": ""
    },
    "body": {}
  },
  "updateVoIPChatMuteConfig": {
    "status": 2,
    "desc": "更新实时语音静音设置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.updateVoIPChatMuteConfig.html",
      "target": ""
    },
    "body": {}
  },
  "subscribeVoIPVideoMembers": {
    "status": 2,
    "desc": "订阅视频画面成员",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.subscribeVoIPVideoMembers.html",
      "target": ""
    },
    "body": {}
  },
  "setEnable1v1Chat": {
    "status": 2,
    "desc": "开启双人通话",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.setEnable1v1Chat.html",
      "target": ""
    },
    "body": {}
  },
  "onVoIPVideoMembersChanged": {
    "status": 2,
    "desc": "监听实时语音通话成员视频状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPVideoMembersChanged.html",
      "target": ""
    },
    "body": {}
  },
  "onVoIPChatSpeakersChanged": {
    "status": 2,
    "desc": "监听实时语音通话成员通话状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPChatSpeakersChanged.html",
      "target": ""
    },
    "body": {}
  },
  "onVoIPChatMembersChanged": {
    "status": 2,
    "desc": "监听实时语音通话成员在线状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPChatMembersChanged.html",
      "target": ""
    },
    "body": {}
  },
  "onVoIPChatInterrupted": {
    "status": 2,
    "desc": "监听被动断开实时语音通话事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPChatInterrupted.html",
      "target": ""
    },
    "body": {}
  },
  "offVoIPVideoMembersChanged": {
    "status": 2,
    "desc": "取消监听实时语音通话成员视频状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.offVoIPVideoMembersChanged.html",
      "target": ""
    },
    "body": {}
  },
  "offVoIPChatMembersChanged": {
    "status": 2,
    "desc": "取消监听实时语音通话成员在线状态变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.offVoIPChatMembersChanged.html",
      "target": ""
    },
    "body": {}
  },
  "offVoIPChatInterrupted": {
    "status": 2,
    "desc": "取消监听被动断开实时语音通话事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.offVoIPChatInterrupted.html",
      "target": ""
    },
    "body": {}
  },
  "joinVoIPChat": {
    "status": 2,
    "desc": "加入 (创建) 实时语音通话",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.joinVoIPChat.html",
      "target": ""
    },
    "body": {}
  },
  "join1v1Chat": {
    "status": 2,
    "desc": "加入（创建）双人通话",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.join1v1Chat.html",
      "target": ""
    },
    "body": {}
  },
  "exitVoIPChat": {
    "status": 2,
    "desc": "退出（销毁）实时语音通话",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.exitVoIPChat.html",
      "target": ""
    },
    "body": {}
  },
  "createMediaRecorder": {
    "status": 2,
    "desc": "创建 WebGL 画面录制器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/media-recorder/wx.createMediaRecorder.html",
      "target": ""
    },
    "body": {}
  },
  "createVideoDecoder": {
    "status": 2,
    "desc": "创建视频解码器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video-decoder/wx.createVideoDecoder.html",
      "target": ""
    },
    "body": {}
  },
  "MapContext.addMarkers": {
    "status": 0,
    "desc": "添加 marker。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/MapContext.addMarkers.html",
      "target": ""
    },
    "body": {}
  },
  "MapContext.removeMarkers": {
    "status": 0,
    "desc": "移除 marker。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/MapContext.removeMarkers.html",
      "target": ""
    },
    "body": {}
  },
  "MapContext.moveToLocation": {
    "status": 0,
    "desc": "移动地图中心位置。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/MapContext.moveToLocation.html",
      "target": ""
    },
    "body": {}
  },
  "VideoContext.play": {
    "status": 0,
    "desc": "播放视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.play.html",
      "target": ""
    },
    "body": {}
  },
  "VideoContext.pause": {
    "status": 0,
    "desc": "暂停播放视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.pause.html",
      "target": ""
    },
    "body": {}
  },
  "VideoContext.stop": {
    "status": 0,
    "desc": "停止播放视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.stop.html",
      "target": ""
    },
    "body": {}
  },
  "VideoContext.seek": {
    "status": 0,
    "desc": "跳转到指定位置播放视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.seek.html",
      "target": ""
    },
    "body": {}
  },
  "AudioContext.pause": {
    "status": 0,
    "desc": "暂停音频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.pause.html",
      "target": ""
    },
    "body": {}
  },
  "AudioContext.play": {
    "status": 0,
    "desc": "播放音频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.play.html",
      "target": ""
    },
    "body": {}
  },
  "AudioContext.seek": {
    "status": 0,
    "desc": "跳转到指定位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.seek.html",
      "target": ""
    },
    "body": {}
  },
  "AudioContext.setSrc": {
    "status": 0,
    "desc": "设置音频地址",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.setSrc.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.start": {
    "status": 1,
    "desc": "开始录音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "format": {
            "type": 0,
            "desc": "音频格式"
          },
          "frameSize": {
            "type": 0,
            "desc": "指定帧大小，单位 KB"
          },
          "audioSource": {
            "type": 0,
            "desc": "指定录音的音频输入源"
          }
        }
      }
    }
  },
  "RecorderManager.pause": {
    "status": 0,
    "desc": "暂停录音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.pause.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.resume": {
    "status": 0,
    "desc": "继续录音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.resume.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.stop": {
    "status": 0,
    "desc": "停止录音",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.stop.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onStart": {
    "status": 0,
    "desc": "监听录音开始事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onStart.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onPause": {
    "status": 0,
    "desc": "监听录音暂停事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onPause.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onResume": {
    "status": 0,
    "desc": "监听录音继续事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onResume.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onStop": {
    "status": 0,
    "desc": "监听录音停止事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onStop.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onError": {
    "status": 0,
    "desc": "监听录音错误事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onError.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onFrameRecorded": {
    "status": 2,
    "desc": "监听已录制完指定帧大小的文件事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onInterruptionBegin": {
    "status": 2,
    "desc": "监听录音因为受到系统占用而被中断开始事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
      "target": ""
    },
    "body": {}
  },
  "RecorderManager.onInterruptionEnd": {
    "status": 2,
    "desc": "监听录音中断结束事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
      "target": ""
    },
    "body": {}
  },
  "CameraContext.setZoom": {
    "status": 0,
    "desc": "设置缩放级别",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.setZoom.html",
      "target": ""
    },
    "body": {}
  },
  "CameraContext.startRecord": {
    "status": 1,
    "desc": "开始录像",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.startRecord.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "selfieMirror": {
            "type": 0,
            "desc": "是否开启镜像"
          }
        }
      }
    }
  },
  "CameraContext.stopRecord": {
    "status": 1,
    "desc": "结束录像",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.stopRecord.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "compressed": {
            "type": 0,
            "desc": "是否压缩视频"
          }
        }
      }
    }
  },
  "CameraContext.onCameraFrame": {
    "status": 2,
    "desc": "获取 Camera 实时帧数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.onCameraFrame.html",
      "target": ""
    },
    "body": {}
  },
  "request": {
    "status": 1,
    "desc": "发起 HTTPS 网络请求",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "responseType": {
            "type": 0,
            "desc": "响应的数据类型"
          },
          "enableHttp2": {
            "type": 0,
            "desc": "开启 http2"
          },
          "enableQuic": {
            "type": 0,
            "desc": "开启 quic"
          },
          "enableCache": {
            "type": 0,
            "desc": "开启 cache"
          },
          "enableHttpDNS": {
            "type": 0,
            "desc": "是否开启 HttpDNS 服务。如开启，需要同时填入"
          },
          "httpDNSServiceId": {
            "type": 0,
            "desc": "HttpDNS 服务商 Id。"
          },
          "enableChunked": {
            "type": 0,
            "desc": "开启 transfer-encoding chunked"
          },
          "forceCellularNetwork": {
            "type": 0,
            "desc": "wifi下使用移动网络发送请求"
          },
          "useHighPerformanceMode": {
            "type": 0,
            "desc": "使用高性能模式"
          },
          "enableProfile": {
            "type": 0,
            "desc": "是否开启 profile"
          },
          "redirect": {
            "type": 0,
            "desc": "重定向拦截策略"
          }
        }
      },
      "returnValue": {
        "props": {
          "header": {
            "type": 0,
            "desc": "开发者服务器返回的 HTTP Response Header"
          },
          "cookies": {
            "type": 0,
            "desc": "开发者服务器返回的 cookies，格式为字符串数组"
          },
          "profile": {
            "type": 0,
            "desc": "网络请求过程中一些调试信息"
          }
        }
      }
    }
  },
  "downloadFile": {
    "status": 1,
    "desc": "下载文件资源到本地",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/wx.downloadFile.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "filePath": {
            "type": 0,
            "desc": "指定文件下载后存储的路径 (本地路径)"
          },
          "enableProfile": {
            "type": 0,
            "desc": "是否开启 profile"
          },
          "enableHttp2": {
            "type": 0,
            "desc": "是否开启 http2"
          }
        }
      },
      "returnValue": {
        "props": {
          "filePath": {
            "type": 0,
            "desc": "用户文件路径 (本地路径)。传入 filePath 时会返回，跟传入的 filePath 一致"
          },
          "profile": {
            "type": 0,
            "desc": "网络请求过程中一些调试信息"
          }
        }
      }
    }
  },
  "uploadFile": {
    "status": 1,
    "desc": "上传本地资源到开发者服务器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "enableProfile": {
            "type": 0,
            "desc": "是否开启 profile"
          },
          "enableHttp2": {
            "type": 0,
            "desc": "是否开启 http2"
          }
        }
      }
    }
  },
  "connectSocket": {
    "status": 1,
    "desc": "创建一个 WebSocket 的连接",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.connectSocket.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "forceCellularNetwork": {
            "type": 0,
            "desc": "强制使用蜂窝网络发送请求"
          }
        }
      }
    }
  },
  "onSocketOpen": {
    "status": 0,
    "desc": "监听WebSocket连接打开事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketOpen.html",
      "target": ""
    },
    "body": {}
  },
  "sendSocketMessage": {
    "status": 0,
    "desc": "通过 WebSocket 连接发送数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.sendSocketMessage.html",
      "target": ""
    },
    "body": {}
  },
  "onSocketMessage": {
    "status": 0,
    "desc": "监听WebSocket接受到服务器的消息事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketMessage.html",
      "target": ""
    },
    "body": {}
  },
  "onSocketError": {
    "status": 0,
    "desc": "监听WebSocket错误",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketError.html",
      "target": ""
    },
    "body": {}
  },
  "onSocketClose": {
    "status": 0,
    "desc": "监听WebSocket关闭",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketClose.html",
      "target": ""
    },
    "body": {}
  },
  "closeSocket": {
    "status": 0,
    "desc": "关闭 WebSocket 连接",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.closeSocket.html",
      "target": ""
    },
    "body": {}
  },
  "stopLocalServiceDiscovery": {
    "status": 2,
    "desc": "停止搜索 mDNS 服务",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.stopLocalServiceDiscovery.html",
      "target": ""
    },
    "body": {}
  },
  "startLocalServiceDiscovery": {
    "status": 2,
    "desc": "开始搜索局域网下的 mDNS 服务",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.startLocalServiceDiscovery.html",
      "target": ""
    },
    "body": {}
  },
  "onLocalServiceResolveFail": {
    "status": 2,
    "desc": "监听 mDNS 服务解析失败的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceResolveFail.html",
      "target": ""
    },
    "body": {}
  },
  "onLocalServiceLost": {
    "status": 2,
    "desc": "监听 mDNS 服务离开的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceLost.html",
      "target": ""
    },
    "body": {}
  },
  "onLocalServiceFound": {
    "status": 2,
    "desc": "监听 mDNS 服务发现的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceFound.html",
      "target": ""
    },
    "body": {}
  },
  "onLocalServiceDiscoveryStop": {
    "status": 2,
    "desc": "监听 mDNS 服务停止搜索的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceDiscoveryStop.html",
      "target": ""
    },
    "body": {}
  },
  "offLocalServiceResolveFail": {
    "status": 2,
    "desc": "取消监听 mDNS 服务解析失败的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceResolveFail.html",
      "target": ""
    },
    "body": {}
  },
  "offLocalServiceLost": {
    "status": 2,
    "desc": "取消监听 mDNS 服务离开的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceLost.html",
      "target": ""
    },
    "body": {}
  },
  "offLocalServiceFound": {
    "status": 2,
    "desc": "取消监听 mDNS 服务发现的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceFound.html",
      "target": ""
    },
    "body": {}
  },
  "offLocalServiceDiscoveryStop": {
    "status": 2,
    "desc": "取消监听 mDNS 服务停止搜索的事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceDiscoveryStop.html",
      "target": ""
    },
    "body": {}
  },
  "createUDPSocket": {
    "status": 2,
    "desc": "创建一个 UDP Socket 实例",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/udp/wx.createUDPSocket.html",
      "target": ""
    },
    "body": {}
  },
  "DownloadTask.abort": {
    "status": 0,
    "desc": "中断下载任务",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.abort.html",
      "target": ""
    },
    "body": {}
  },
  "DownloadTask.onProgressUpdate": {
    "status": 0,
    "desc": "监听下载进度变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.onProgressUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "DownloadTask.offProgressUpdate": {
    "status": 0,
    "desc": "移除下载进度变化事件的监听函数",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.offProgressUpdate.html",
      "target": ""
    },
    "body": {}
  },
  "DownloadTask.onHeadersReceived": {
    "status": 2,
    "desc": "监听 HTTP Response Header 事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.html",
      "target": ""
    },
    "body": {}
  },
  "DownloadTask.offHeadersReceived": {
    "status": 2,
    "desc": "移除 HTTP Response Header 事件的监听函数",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.html",
      "target": ""
    },
    "body": {}
  },
  "login": {
    "status": 1,
    "desc": "调用接口获取登录凭证（code）",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html",
      "target": ""
    },
    "body": {
      "type": 1,
      "value": "getAuthCode",
      "msg": "命名不同/参数缺失",
      "params": {
        "timeout": {
          "type": {
            "type": 0,
            "desc": "超时时长，单位ms"
          }
        }
      }
    }
  },
  "getUserProfile": {
    "status": 1,
    "desc": "获取用户信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html",
      "target": ""
    },
    "body": {
      "type": 1,
      "value": "getOpenUserInfo",
      "msg": "命名不同/参数缺失/返回值缺失",
      "params": {
        "lang": {
          "type": {
            "type": 0,
            "desc": "显示用户信息的语言"
          }
        },
        "desc": {
          "type": {
            "type": 0,
            "desc": "声明获取用户个人信息后的用途，不超过30个字符"
          }
        }
      },
      "returnValue": {
        "props": {
          "rawData": {
            "type": 0,
            "desc": "不包括敏感信息的原始数据字符串，用于计算签名"
          },
          "signature": {
            "type": 0,
            "desc": "使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息"
          },
          "encryptedData": {
            "type": 0,
            "desc": "包括敏感数据在内的完整用户信息的加密数据"
          },
          "iv": {
            "type": 0,
            "desc": "加密算法的初始向量"
          },
          "cloudID": {
            "type": 0,
            "desc": "敏感数据对应的云 ID，开通云开发的小程序才会返回，可通过云调用直接获取开放数据"
          }
        }
      }
    }
  },
  "checkSession": {
    "status": 2,
    "desc": "检查登录态是否过期",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.checkSession.html",
      "target": ""
    },
    "body": {}
  },
  "navigateToMiniProgram": {
    "status": 1,
    "desc": "打开另一个小程序",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "extraData": {
            "type": 0,
            "desc": "需要传递给目标小程序的数据"
          },
          "envVersion": {
            "type": 0,
            "desc": "要打开的小程序版本"
          },
          "shortLink": {
            "type": 0,
            "desc": "小程序链接"
          },
          "noRelaunchIfPathUnchanged": {
            "type": 0,
            "desc": "不relaunch目标小程序"
          }
        }
      }
    }
  },
  "navigateBackMiniProgram": {
    "status": 2,
    "desc": "返回到上一个小程序",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/miniprogram-navigate/wx.navigateBackMiniProgram.html",
      "target": ""
    },
    "body": {}
  },
  "getAccountInfoSync": {
    "status": 2,
    "desc": "获取当前帐号信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/account-info/wx.getAccountInfoSync.html",
      "target": ""
    },
    "body": {}
  },
  "getUserInfo": {
    "status": 2,
    "desc": "获取用户信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserInfo.html",
      "target": ""
    },
    "body": {}
  },
  "UserInfo": {
    "status": 2,
    "desc": "用户信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/UserInfo.html",
      "target": ""
    },
    "body": {}
  },
  "reportMonitor": {
    "status": 2,
    "desc": "自定义业务数据监控上报接口",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/report/wx.reportMonitor.html",
      "target": ""
    },
    "body": {}
  },
  "reportAnalytics": {
    "status": 2,
    "desc": "自定义分析数据上报接口",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/data-analysis/wx.reportAnalytics.html",
      "target": ""
    },
    "body": {}
  },
  "requestPayment": {
    "status": 2,
    "desc": "发起支付",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html",
      "target": ""
    },
    "body": {
      "msg": "差异较大，建议参考macle文档startPay"
    }
  },
  "authorize": {
    "status": 0,
    "desc": "提前向用户发起授权请求",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/authorize/wx.authorize.html",
      "target": ""
    },
    "body": {}
  },
  "openSetting": {
    "status": 1,
    "desc": "调起客户端小程序设置界面",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/wx.openSetting.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "withSubscriptions": {
            "type": 0,
            "desc": "是否同时获取用户订阅消息的订阅状态，默认不获取。注意：withSubscriptions 只返回用户勾选过订阅面板中的“总是保持以上选择，不再询问”的订阅消息"
          }
        }
      },
      "returnValue": {
        "props": {
          "subscriptionsSetting": {
            "type": 0,
            "desc": "用户订阅消息设置，接口参数withSubscriptions值为true时才会返回。"
          }
        }
      }
    }
  },
  "getSetting": {
    "status": 1,
    "desc": "获取用户的当前设置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/wx.getSetting.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "withSubscriptions": {
            "type": 0,
            "desc": "是否同时获取用户订阅消息的订阅状态，默认不获取。注意：withSubscriptions 只返回用户勾选过订阅面板中的“总是保持以上选择，不再询问”的订阅消息"
          }
        }
      },
      "returnValue": {
        "props": {
          "subscriptionsSetting": {
            "type": 0,
            "desc": "用户订阅消息设置"
          },
          "miniprogramAuthSetting": {
            "type": 0,
            "desc": "在插件中调用时，当前宿主小程序的用户授权结果"
          }
        }
      }
    }
  },
  "AuthSetting": {
    "status": 2,
    "desc": "用户授权设置信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/AuthSetting.html",
      "target": ""
    },
    "body": {}
  },
  "chooseAddress": {
    "status": 2,
    "desc": "打开地图选择位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/address/wx.chooseAddress.html",
      "target": ""
    },
    "body": {}
  },
  "openCard": {
    "status": 2,
    "desc": "查看微信卡包中的卡券",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/card/wx.openCard.html",
      "target": ""
    },
    "body": {}
  },
  "addCard": {
    "status": 2,
    "desc": "添加卡券",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/card/wx.addCard.html",
      "target": ""
    },
    "body": {}
  },
  "reportEvent": {
    "status": 1,
    "desc": "事件上报",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/data-analysis/wx.reportEvent.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "data": {
            "type": 0,
            "desc": "可被 JSON.stringify 的对象，将一起上报至系统"
          }
        }
      }
    }
  },
  "chooseInvoiceTitle": {
    "status": 2,
    "desc": "选择用户的发票抬头",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/invoice/wx.chooseInvoiceTitle.html",
      "target": ""
    },
    "body": {}
  },
  "chooseInvoice": {
    "status": 2,
    "desc": "选择用户已有的发票",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/invoice/wx.chooseInvoice.html",
      "target": ""
    },
    "body": {}
  },
  "startSoterAuthentication": {
    "status": 2,
    "desc": "开始 SOTER 生物认证",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/soter/wx.startSoterAuthentication.html",
      "target": ""
    },
    "body": {}
  },
  "checkIsSupportSoterAuthentication": {
    "status": 2,
    "desc": "获取本机支持的 SOTER 生物认证方式",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/soter/wx.checkIsSupportSoterAuthentication.html",
      "target": ""
    },
    "body": {}
  },
  "checkIsSoterEnrolledInDevice": {
    "status": 2,
    "desc": "获取设备内是否录入如指纹等生物信息的接口",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/soter/wx.checkIsSoterEnrolledInDevice.html",
      "target": ""
    },
    "body": {}
  },
  "getWeRunData": {
    "status": 2,
    "desc": "获取用户过去三十天微信运动步数",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/werun/wx.getWeRunData.html",
      "target": ""
    },
    "body": {}
  },
  "reportPerformance": {
    "status": 2,
    "desc": "小程序测速上报",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/base/performance/wx.reportPerformance.html",
      "target": ""
    },
    "body": {}
  },
  "getPerformance": {
    "status": 2,
    "desc": "获取当前小程序性能相关的信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/performance/wx.getPerformance.html",
      "target": ""
    },
    "body": {}
  },
  "requestSubscribeMessage": {
    "status": 2,
    "desc": "调起客户端小程序订阅消息界面，返回用户订阅消息的操作结果",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/subscribe-message/wx.requestSubscribeMessage.html",
      "target": ""
    },
    "body": {}
  },
  "showRedPackage": {
    "status": 2,
    "desc": "拉取h5领取红包封面页",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/redpackage/wx.showRedPackage.html",
      "target": ""
    },
    "body": {}
  },
  "getGroupEnterInfo": {
    "status": 2,
    "desc": "获取群工具小程序启动信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/group/wx.getGroupEnterInfo.html",
      "target": ""
    },
    "body": {}
  },
  "switchTab": {
    "status": 0,
    "desc": "跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.switchTab.html",
      "target": ""
    },
    "body": {}
  },
  "reLaunch": {
    "status": 0,
    "desc": "关闭所有页面，打开到应用内的某个页面",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.reLaunch.html",
      "target": ""
    },
    "body": {}
  },
  "redirectTo": {
    "status": 0,
    "desc": "关闭当前页面，跳转到应用内的某个页面。但是不允许跳转到 tabbar 页面",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.redirectTo.html",
      "target": ""
    },
    "body": {}
  },
  "navigateTo": {
    "status": 1,
    "desc": "保留当前页面，跳转到应用内的某个页面。但是不能跳到 tabbar 页面。使用 wx.navigateBack 可以返回到原页面。小程序中页面栈最多十层",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "routeType": {
            "type": 0,
            "desc": "自定义路由类型"
          }
        }
      }
    }
  },
  "navigateBack": {
    "status": 0,
    "desc": "关闭当前页面，返回上一页面或多级页面",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateBack.html",
      "target": ""
    },
    "body": {}
  },
  "exitMiniProgram": {
    "status": 0,
    "desc": "退出当前小程序",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.exitMiniProgram.html",
      "target": ""
    },
    "body": {}
  },
  "updateShareMenu": {
    "status": 2,
    "desc": "更新转发属性",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.updateShareMenu.html",
      "target": ""
    },
    "body": {}
  },
  "showShareMenu": {
    "status": 2,
    "desc": "显示当前页面的转发按钮",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.showShareMenu.html",
      "target": ""
    },
    "body": {}
  },
  "hideShareMenu": {
    "status": 2,
    "desc": "隐藏转发按钮",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.hideShareMenu.html",
      "target": ""
    },
    "body": {}
  },
  "getShareInfo": {
    "status": 2,
    "desc": "获取转发详细信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.getShareInfo.html",
      "target": ""
    },
    "body": {}
  },
  "authPrivateMessage": {
    "status": 2,
    "desc": "验证私密消息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.authPrivateMessage.html",
      "target": ""
    },
    "body": {}
  },
  "setStorageSync": {
    "status": 0,
    "desc": "将数据存储在本地缓存中指定的 key 中",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html",
      "target": ""
    },
    "body": {}
  },
  "setStorage": {
    "status": 0,
    "desc": "将数据存储在本地缓存中指定的 key 中异步接口",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorage.html",
      "target": ""
    },
    "body": {}
  },
  "removeStorageSync": {
    "status": 2,
    "desc": "从本地缓存中同步移除指定 key",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorageSync.html",
      "target": ""
    },
    "body": {}
  },
  "removeStorage": {
    "status": 0,
    "desc": "从本地缓存中移除指定 key",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorage.html",
      "target": ""
    },
    "body": {}
  },
  "getStorageSync": {
    "status": 0,
    "desc": "获取缓存数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html",
      "target": ""
    },
    "body": {}
  },
  "getStorageInfoSync": {
    "status": 2,
    "desc": "获取当前storage的相关信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageInfoSync.html",
      "target": ""
    },
    "body": {}
  },
  "getStorageInfo": {
    "status": 0,
    "desc": "异步获取当前storage的相关信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageInfo.html",
      "target": ""
    },
    "body": {}
  },
  "getStorage": {
    "status": 0,
    "desc": "从本地缓存中异步获取指定 key 的内容",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorage.html",
      "target": ""
    },
    "body": {}
  },
  "clearStorageSync": {
    "status": 2,
    "desc": "同步清理本地数据缓存",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.clearStorageSync.html",
      "target": ""
    },
    "body": {}
  },
  "clearStorage": {
    "status": 0,
    "desc": "清理本地数据缓存",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.clearStorage.html",
      "target": ""
    },
    "body": {}
  },
  "setBackgroundFetchToken": {
    "status": 2,
    "desc": "设置自定义登录态",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.setBackgroundFetchToken.html",
      "target": ""
    },
    "body": {}
  },
  "onBackgroundFetchData": {
    "status": 2,
    "desc": "监听收到 backgroundFetch 数据时的回调",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.onBackgroundFetchData.html",
      "target": ""
    },
    "body": {}
  },
  "getBackgroundFetchToken": {
    "status": 2,
    "desc": "获取设置过的自定义登录态",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.getBackgroundFetchToken.html",
      "target": ""
    },
    "body": {}
  },
  "getBackgroundFetchData": {
    "status": 0,
    "desc": "拉取 backgroundFetch 客户端缓存数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.getBackgroundFetchData.html",
      "target": ""
    },
    "body": {}
  },
  "createSelectorQuery": {
    "status": 0,
    "desc": "返回一个 SelectorQuery 对象实例",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createSelectorQuery.html",
      "target": ""
    },
    "body": {}
  },
  "createIntersectionObserver": {
    "status": 2,
    "desc": "创建并返回一个 IntersectionObserver 对象实例",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createIntersectionObserver.html",
      "target": ""
    },
    "body": {}
  },
  "IntersectionObserver": {
    "status": 2,
    "desc": "IntersectionObserver 对象，用于推断某些节点是否可以被用户看见、有多大比例可以被用户看见",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html",
      "target": ""
    },
    "body": {}
  },
  "NodesRef": {
    "status": 2,
    "desc": "用于获取 WXML 节点信息的对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/NodesRef.html",
      "target": ""
    },
    "body": {}
  },
  "SelectorQuery": {
    "status": 0,
    "desc": "查询节点信息的对象",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.html",
      "target": ""
    },
    "body": {}
  },
  "SelectorQuery.exec": {
    "status": 0,
    "desc": "执行所有的请求",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.exec.html",
      "target": ""
    },
    "body": {}
  },
  "SelectorQuery.in": {
    "status": 0,
    "desc": "将选择器的选取范围更改为自定义组件 component 内",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.in.html",
      "target": ""
    },
    "body": {}
  },
  "SelectorQuery.select": {
    "status": 0,
    "desc": "在当前页面下选择匹配选择器（selector）的第一个节点",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.select.html",
      "target": ""
    },
    "body": {}
  },
  "SelectorQuery.selectAll": {
    "status": 0,
    "desc": "在当前页面下选择匹配选择器（selector）的所有节点",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.selectAll.html",
      "target": ""
    },
    "body": {}
  },
  "SelectorQuery.selectViewport": {
    "status": 0,
    "desc": "选择显示区域。可用于获取显示区域的尺寸、滚动位置等信息。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.selectViewport.html",
      "target": ""
    },
    "body": {}
  },
  "showToast": {
    "status": 0,
    "desc": "显示消息提示框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showToast.html",
      "target": ""
    },
    "body": {}
  },
  "showModal": {
    "status": 1,
    "desc": "显示模态对话框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showModal.html",
      "target": ""
    },
    "body": {
      "msg": "参数缺失",
      "params": {
        "props": {
          "placeholderText": {
            "type": 0,
            "desc": "显示输入框时的提示文本"
          }
        }
      }
    }
  },
  "showLoading": {
    "status": 0,
    "desc": "显示 loading 提示框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showLoading.html",
      "target": ""
    },
    "body": {}
  },
  "showActionSheet": {
    "status": 0,
    "desc": "显示操作菜单",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showActionSheet.html",
      "target": ""
    },
    "body": {}
  },
  "hideToast": {
    "status": 1,
    "desc": "隐藏消息提示框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideToast.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "noConflict": {
            "type": 0,
            "desc": "目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性"
          }
        }
      }
    }
  },
  "hideLoading": {
    "status": 1,
    "desc": "隐藏 loading 提示框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideLoading.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "noConflict": {
            "type": 0,
            "desc": "目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性"
          }
        }
      }
    }
  },
  "showNavigationBarLoading": {
    "status": 2,
    "desc": "在当前页面显示导航条加载动画",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.showNavigationBarLoading.html",
      "target": ""
    },
    "body": {}
  },
  "setNavigationBarTitle": {
    "status": 0,
    "desc": "动态设置当前页面的标题",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarTitle.html",
      "target": ""
    },
    "body": {}
  },
  "setNavigationBarColor": {
    "status": 0,
    "desc": "设置页面导航条颜色",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarColor.html",
      "target": ""
    },
    "body": {}
  },
  "hideNavigationBarLoading": {
    "status": 2,
    "desc": "在当前页面隐藏导航条加载动画",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.hideNavigationBarLoading.html",
      "target": ""
    },
    "body": {}
  },
  "hideHomeButton": {
    "status": 2,
    "desc": "隐藏返回首页按钮",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.hideHomeButton.html",
      "target": ""
    },
    "body": {}
  },
  "setBackgroundTextStyle": {
    "status": 0,
    "desc": "动态设置下拉背景字体、loading 图的样式",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/background/wx.setBackgroundTextStyle.html",
      "target": ""
    },
    "body": {}
  },
  "setBackgroundColor": {
    "status": 0,
    "desc": "动态设置窗口的背景色",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/background/wx.setBackgroundColor.html",
      "target": ""
    },
    "body": {}
  },
  "showTabBarRedDot": {
    "status": 0,
    "desc": "显示tabBar某一项的右上角的红点",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.showTabBarRedDot.html",
      "target": ""
    },
    "body": {}
  },
  "showTabBar": {
    "status": 0,
    "desc": "显示 tabBar",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.showTabBar.html",
      "target": ""
    },
    "body": {}
  },
  "setTabBarStyle": {
    "status": 0,
    "desc": "动态设置 tabBar 的整体样式",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarStyle.html",
      "target": ""
    },
    "body": {}
  },
  "setTabBarItem": {
    "status": 0,
    "desc": "动态设置 tabBar 某一项的内容",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarItem.html",
      "target": ""
    },
    "body": {}
  },
  "setTabBarBadge": {
    "status": 0,
    "desc": "为 tabBar 某一项的右上角添加文本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarBadge.html",
      "target": ""
    },
    "body": {}
  },
  "removeTabBarBadge": {
    "status": 0,
    "desc": "移除 tabBar 某一项右上角的文本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.removeTabBarBadge.html",
      "target": ""
    },
    "body": {}
  },
  "hideTabBarRedDot": {
    "status": 0,
    "desc": "隐藏 tabBar 某一项的右上角的红点",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.hideTabBarRedDot.html",
      "target": ""
    },
    "body": {}
  },
  "hideTabBar": {
    "status": 0,
    "desc": "隐藏 tabBar",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.hideTabBar.html",
      "target": ""
    },
    "body": {}
  },
  "loadFontFace": {
    "status": 1,
    "desc": "动态加载网络字体",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/font/wx.loadFontFace.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "scopes": {
            "type": 0,
            "desc": "字体作用范围"
          }
        }
      }
    }
  },
  "stopPullDownRefresh": {
    "status": 0,
    "desc": "停止当前页面下拉刷新",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.stopPullDownRefresh.html",
      "target": ""
    },
    "body": {}
  },
  "startPullDownRefresh": {
    "status": 0,
    "desc": "开始下拉刷新。调用后触发下拉刷新动画，效果与用户手动下拉刷新一致",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.startPullDownRefresh.html",
      "target": ""
    },
    "body": {}
  },
  "pageScrollTo": {
    "status": 1,
    "desc": "将页面滚动到目标位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/scroll/wx.pageScrollTo.html",
      "target": ""
    },
    "body": {
      "msg": "参数差异",
      "params": {
        "props": {
          "selector": {
            "type": 0,
            "desc": "选择器"
          },
          "offsetTop": {
            "type": 0,
            "desc": "偏移距离，需要和 selector 参数搭配使用，可以滚动到 selector 加偏移距离的位置，单位 px"
          }
        }
      }
    }
  },
  "createAnimation": {
    "status": 2,
    "desc": "创建一个动画实例 animation",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/animation/wx.createAnimation.html",
      "target": ""
    },
    "body": {}
  },
  "setTopBarText": {
    "status": 2,
    "desc": "动态设置置顶栏文字内容",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/sticky/wx.setTopBarText.html",
      "target": ""
    },
    "body": {}
  },
  "nextTick": {
    "status": 0,
    "desc": "延迟一部分操作到下一个时间片再执行",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/custom-component/wx.nextTick.html",
      "target": ""
    },
    "body": {}
  },
  "getMenuButtonBoundingClientRect": {
    "status": 1,
    "desc": "获取菜单按钮（右上角胶囊按钮）的布局位置信息",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html",
      "target": ""
    },
    "body": {
      "msg": "返回值不同",
      "returnValue": {
        "props": {
          "success": {
            "type": 0,
            "desc": "微信直接返回const res = wx.getMenuButtonBoundingClientRect()，华为macle用函数ma.getMenuButtonBoundingClientRect({success(res) {console.log(res.width);}})"
          }
        }
      }
    }
  },
  "onWindowResize": {
    "status": 2,
    "desc": "监听窗口尺寸变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.onWindowResize.html",
      "target": ""
    },
    "body": {}
  },
  "offWindowResize": {
    "status": 2,
    "desc": "取消监听窗口尺寸变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.offWindowResize.html",
      "target": ""
    },
    "body": {}
  },
  "enableAlertBeforeUnload": {
    "status": 2,
    "desc": "开启小程序页面返回询问对话框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.enableAlertBeforeUnload.html",
      "target": ""
    },
    "body": {}
  },
  "disableAlertBeforeUnload": {
    "status": 2,
    "desc": "关闭小程序页面返回询问对话框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.disableAlertBeforeUnload.html",
      "target": ""
    },
    "body": {}
  },
  "setWindowSize": {
    "status": 2,
    "desc": "设置窗口大小，该接口仅适用于 PC 平台",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.setWindowSize.html",
      "target": ""
    },
    "body": {}
  },
  "onKeyboardHeightChange": {
    "status": 0,
    "desc": "监听键盘高度变化",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.onKeyboardHeightChange.html",
      "target": ""
    },
    "body": {}
  },
  "offKeyboardHeightChange": {
    "status": 0,
    "desc": "取消监听键盘高度变化事件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.offKeyboardHeightChange.html",
      "target": ""
    },
    "body": {}
  },
  "hideKeyboard": {
    "status": 0,
    "desc": "在input、textarea等focus拉起键盘之后，手动调用此接口收起键盘",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.hideKeyboard.html",
      "target": ""
    },
    "body": {}
  },
  "getSelectedTextRange": {
    "status": 2,
    "desc": "在input、textarea等focus之后，获取输入框的光标位置",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.getSelectedTextRange.html",
      "target": ""
    },
    "body": {}
  }
} as Record<string, Rule>;

export const components = {
  "swiper": {
    "status": 1,
    "name": "滑块视图容器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html",
      "target": ""
    },
    "props": {
      "previous-margin": {
        "type": 0,
        "status": 2,
        "desc": "前边距，可用于露出前一项的一小部分，接受 px 和 rpx 值"
      },
      "next-margin": {
        "type": 0,
        "status": 2,
        "desc": "后边距，可用于露出后一项的一小部分，接受 px 和 rpx 值"
      },
      "snap-to-edge": {
        "type": 0,
        "status": 2,
        "desc": "当 swiper-item 的个数大于等于 2，关闭 circular 并且开启 previous-margin 或 next-margin 的时候，可以指定这个边距是否应用到第一个、最后一个元素"
      },
      "display-multiple-items": {
        "type": 0,
        "status": 2,
        "desc": "同时显示的滑块数量"
      },
      "bindtransition": {
        "type": 0,
        "status": 2,
        "desc": "swiper-item 的位置发生改变时会触发 transition 事件，event.detail = {dx: dx, dy: dy}"
      },
      "bindanimationfinish": {
        "type": 0,
        "status": 2,
        "desc": "动画结束时会触发 animationfinish 事件，event.detail 同上"
      }
    },
    "desc": "其中只可放置swiper-item组件，否则会导致未定义的行为。"
  },
  "view": {
    "type": 7,
    "status": 0,
    "name": "视图容器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/view.html",
      "target": ""
    },
    "desc": "视图容器"
  },
  "movable-view": {
    "type": 0,
    "status": 2,
    "name": "可移动的视图容器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/movable-view.html",
      "target": ""
    },
    "desc": "在页面中可以拖拽滑动。movable-view必须在 movable-area 组件中，并且必须是直接子节点，否则不能移动。"
  },
  "cover-image": {
    "type": 0,
    "status": 2,
    "name": "覆盖在原生组件之上的图片视图",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/cover-image.html",
      "target": ""
    },
    "desc": "可覆盖的原生组件同cover-view，支持嵌套在cover-view里。"
  },
  "cover-view": {
    "type": 0,
    "status": 2,
    "name": "覆盖在原生组件之上的文本视图。",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/cover-view.html",
      "target": ""
    },
    "desc": "可覆盖的原生组件包括 map、video、canvas、camera、live-player、live-pusher只支持嵌套 cover-view、cover-image"
  },
  "movable-area": {
    "type": 0,
    "status": 2,
    "name": "movable-view的可移动区域",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/movable-area.html",
      "target": ""
    },
    "desc": "movable-view的可移动区域。"
  },
  "scroll-view": {
    "status": 1,
    "name": "可滚动视图区域",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html",
      "target": ""
    },
    "props": {
      "enable-flex": {
        "type": 0,
        "status": 2,
        "desc": "启用 flexbox 布局。开启后，当前节点声明了 display: flex 就会成为 flex container，并作用于其孩子节点。"
      },
      "scroll-anchoring": {
        "type": 0,
        "status": 2,
        "desc": "开启 scroll anchoring 特性，即控制滚动位置不随内容变化而抖动，仅在 iOS 下生效，安卓下可参考 CSS overflow-anchor 属性"
      },
      "refresher-enabled": {
        "type": 0,
        "status": 2,
        "desc": "开启自定义下拉刷新"
      },
      "refresher-threshold": {
        "type": 0,
        "status": 2,
        "desc": "设置自定义下拉刷新阈值"
      },
      "refresher-default-style": {
        "type": 0,
        "status": 2,
        "desc": "设置自定义下拉刷新默认样式，支持设置 black | white | none， none 表示不使用默认样式"
      },
      "refresher-background": {
        "type": 0,
        "status": 2,
        "desc": "设置自定义下拉刷新区域背景颜色"
      },
      "refresher-triggered": {
        "type": 0,
        "status": 2,
        "desc": "设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发"
      },
      "bounces": {
        "type": 0,
        "status": 2,
        "desc": "iOS 下 scroll-view 边界弹性控制 (同时开启 enhanced 属性后生效)"
      },
      "paging-enabled": {
        "type": 0,
        "status": 2,
        "desc": "分页滑动效果 (同时开启 enhanced 属性后生效)"
      },
      "fast-deceleration": {
        "type": 0,
        "status": 2,
        "desc": "滑动减速速率控制 (同时开启 enhanced 属性后生效)"
      },
      "bindrefresherpulling": {
        "type": 0,
        "status": 2,
        "desc": "自定义下拉刷新控件被下拉"
      },
      "bindrefresherrefresh": {
        "type": 0,
        "status": 2,
        "desc": "自定义下拉刷新被触发"
      },
      "bindrefresherrestore": {
        "type": 0,
        "status": 2,
        "desc": "自定义下拉刷新被复位"
      },
      "bindrefresherabort": {
        "type": 0,
        "status": 2,
        "desc": "自定义下拉刷新被中止"
      }
    },
    "desc": "使用竖向滚动时，需要给scroll-view一个固定高度，通过 WXSS 设置 height。组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。"
  },
  "swiper-item": {
    "type": 7,
    "status": 0,
    "name": "仅可放置在swiper组件中，宽高自动设置为100%",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/swiper-item.html",
      "target": ""
    },
    "desc": "仅可放置在swiper组件中，宽高自动设置为100%。"
  },
  "icon": {
    "type": 7,
    "status": 0,
    "name": "图标",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/icon.html",
      "target": ""
    },
    "desc": "组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。"
  },
  "progress": {
    "status": 1,
    "name": "进度条",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/progress.html",
      "target": ""
    },
    "props": {
      "color": {
        "type": 0,
        "status": 2,
        "desc": "进度条颜色（请使用activeColor）"
      }
    },
    "desc": "组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。"
  },
  "text": {
    "type": 7,
    "status": 0,
    "name": "文本",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/text.html",
      "target": ""
    },
    "desc": "文本。"
  },
  "rich-text": {
    "name": "富文本",
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/rich-text.html",
      "target": ""
    },
    "desc": "富文本"
  },
  "form": {
    "status": 1,
    "name": "表单",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/form.html",
      "target": ""
    },
    "props": {
      "report-submit-timeout": {
        "type": 0,
        "status": 2,
        "desc": "等待一段时间（毫秒数）以确认 formId 是否生效"
      }
    },
    "desc": "将组件内的用户输入的switch input checkbox slider radio picker 提交。"
  },
  "input": {
    "status": 1,
    "name": "输入框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/input.html",
      "target": ""
    },
    "props": {
      "auto-focus": {
        "type": 0,
        "status": 2,
        "desc": "(即将废弃，请直接使用 focus )自动聚焦，拉起键盘"
      },
      "always-embed": {
        "type": 0,
        "status": 2,
        "desc": "安全键盘加密公钥的路径，只支持包内路径"
      },
      "safe-password-cert-path": {
        "type": 0,
        "status": 2,
        "desc": "强制 input 处于同层状态，默认 focus 时 input 会切到非同层状态 (仅在 iOS 下生效)"
      },
      "safe-password-length": {
        "type": 0,
        "status": 2,
        "desc": "安全键盘输入密码长度"
      },
      "safe-password-time-stamp": {
        "type": 0,
        "status": 2,
        "desc": "安全键盘加密时间戳"
      },
      "safe-password-nonce": {
        "type": 0,
        "status": 2,
        "desc": "安全键盘加密盐值"
      },
      "safe-password-salt": {
        "type": 0,
        "status": 2,
        "desc": "安全键盘计算hash盐值，若指定custom-hash 则无效"
      },
      "safe-password-custom-hash": {
        "type": 0,
        "status": 2,
        "desc": "安全键盘计算hash的算法表达式"
      }
    },
    "desc": "该组件是原生组件，使用时请注意相关限制"
  },
  "picker": {
    "type": 7,
    "status": 0,
    "name": "从底部弹起的滚动选择器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/picker.html",
      "target": ""
    },
    "desc": "从底部弹起的滚动选择器。"
  },
  "radio": {
    "type": 7,
    "status": 0,
    "name": "单选项目",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/radio.html",
      "target": ""
    },
    "desc": "单选项目。"
  },
  "slider": {
    "status": 1,
    "name": "滑动选择器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/slider.html",
      "target": ""
    },
    "props": {
      "color": {
        "type": 0,
        "status": 2,
        "desc": "背景条的颜色（请使用 backgroundColor）"
      },
      "selected-color": {
        "type": 0,
        "status": 2,
        "desc": "已选择的颜色（请使用 activeColor）"
      }
    },
    "desc": "滑动选择器。"
  },
  "textarea": {
    "type": 7,
    "status": 0,
    "name": "多行输入框",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/textarea.html",
      "target": ""
    },
    "desc": "该组件是原生组件，使用时请注意相关限制。"
  },
  "button": {
    "status": 1,
    "name": "按钮",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/button.html",
      "target": ""
    },
    "props": {
      "open-type": {
        "type": 0,
        "status": 2,
        "desc": "微信开放能力"
      },
      "lang": {
        "type": 0,
        "status": 2,
        "desc": "指定返回用户信息的语言，zh_CN 简体中文，zh_TW 繁体中文，en 英文。"
      },
      "session-from": {
        "type": 0,
        "status": 2,
        "desc": "会话来源，open-type=contact时有效"
      },
      "send-message-title": {
        "type": 0,
        "status": 2,
        "desc": "会话内消息卡片标题，open-type=contact时有效"
      },
      "send-message-path": {
        "type": 0,
        "status": 2,
        "desc": "会话内消息卡片点击跳转小程序路径，open-type=contact时有效"
      },
      "send-message-img": {
        "type": 0,
        "status": 2,
        "desc": "会话内消息卡片图片，open-type=contact时有效"
      },
      "app-parameter": {
        "type": 0,
        "status": 2,
        "desc": "打开 APP 时，向 APP 传递的参数，open-type=launchApp时有效"
      },
      "show-message-card": {
        "type": 0,
        "status": 2,
        "desc": "是否显示会话内消息卡片，设置此参数为 true，用户进入客服会话会在右下角显示'可能要发送的小程序'提示"
      },
      "bindgetuserinfo": {
        "type": 0,
        "status": 2,
        "desc": "用户点击该按钮时，会返回获取到的用户信息，回调的detail数据与wx.getUserInfo返回的一致，open-type=getUserInfo时有效"
      },
      "bindcontact": {
        "type": 0,
        "status": 2,
        "desc": "客服消息回调，open-type=contact时有效"
      },
      "bindgetphonenumber": {
        "type": 0,
        "status": 2,
        "desc": "获取用户手机号回调，open-type=getPhoneNumber时有效"
      },
      "binderror": {
        "type": 0,
        "status": 2,
        "desc": "当使用开放能力时，发生错误的回调，open-type=launchApp时有效"
      },
      "bindopensetting": {
        "type": 0,
        "status": 2,
        "desc": "在打开授权设置页后回调，open-type=openSetting时有效"
      },
      "bindlaunchapp": {
        "type": 0,
        "status": 2,
        "desc": "打开 APP 成功的回调，open-type=launchApp时有效"
      },
      "bindchooseavatar": {
        "type": 0,
        "status": 2,
        "desc": "获取用户头像回调，open-type=chooseAvatar时有效"
      }
    },
    "desc": "按钮"
  },
  "editor": {
    "name": "富文本编辑器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/editor.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "富文本编辑器，可以对图片、文字进行编辑"
  },
  "label": {
    "name": "用于改进表单组件的可用性",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/label.html",
      "target": ""
    },
    "type": 7,
    "status": 0,
    "desc": "用于改进表单组件的可用性"
  },
  "checkbox-group": {
    "type": 7,
    "status": 0,
    "name": "多项选择器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/checkbox-group.html",
      "target": ""
    },
    "desc": "多项选择器，内部由多个checkbox组成。"
  },
  "picker-view": {
    "status": 1,
    "name": "嵌入页面的滚动选择器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/picker-view.html",
      "target": ""
    },
    "props": {
      "immediate-change": {
        "type": 0,
        "status": 2,
        "desc": "是否在手指松开时立即触发 change 事件。若不开启则会在滚动动画结束后触发 change 事件。"
      }
    },
    "desc": "其中只可放置 picker-view-column组件，其它节点不会显示。"
  },
  "picker-view-column": {
    "type": 7,
    "status": 0,
    "name": "滚动选择器子项",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/picker-view-column.html",
      "target": ""
    },
    "desc": "仅可放置于picker-view中，其孩子节点的高度会自动设置成与picker-view的选中框的高度一致"
  },
  "radio-group": {
    "type": 7,
    "status": 0,
    "name": "单项选择器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/radio-group.html",
      "target": ""
    },
    "desc": "单项选择器，内部由多个 radio 组成。"
  },
  "switch": {
    "type": 7,
    "status": 0,
    "name": "开关选择器",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/switch.html",
      "target": ""
    },
    "desc": "开关选择器。"
  },
  "navigator": {
    "status": 1,
    "name": "页面链接",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/navigator.html",
      "target": ""
    },
    "props": {
      "target": {
        "type": 0,
        "status": 2,
        "desc": "在哪个目标上发生跳转，默认当前小程序"
      },
      "app-id": {
        "type": 0,
        "status": 2,
        "desc": "当`target=miniProgram`时有效，要打开的小程序 appId"
      },
      "path": {
        "type": 0,
        "status": 2,
        "desc": "当`target=miniProgram`时有效，打开的页面路径，如果为空则打开首页"
      },
      "extra-data": {
        "type": 0,
        "status": 2,
        "desc": "当`target=miniProgram`时有效，需要传递给目标小程序的数据，目标小程序可在 `App.onLaunch()`，`App.onShow()` 中获取到这份数据。"
      },
      "version": {
        "type": 0,
        "status": 2,
        "desc": "当`target=miniProgram`时有效，要打开的小程序版本"
      },
      "short-link": {
        "type": 0,
        "status": 2,
        "desc": "当`target=miniProgram`时有效，当传递该参数后，可以不传 app-id 和 path。链接可以通过【小程序菜单】->【复制链接】获取"
      }
    },
    "desc": "页面链接。"
  },
  "functional-page-navigator": {
    "name": "仅在插件中有效，用于跳转到插件功能页",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/functional-page-navigator.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "仅在插件中有效，用于跳转到插件功能页"
  },
  "audio": {
    "type": 7,
    "status": 0,
    "name": "音频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/audio.html",
      "target": ""
    },
    "desc": "1.6.0版本开始，该组件不再维护。建议使用能力更强的 wx.createInnerAudioContext 接口"
  },
  "image": {
    "status": 1,
    "name": "图片",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/image.html",
      "target": ""
    },
    "props": {
      "lazy-load": {
        "type": 0,
        "status": 2,
        "desc": "图片懒加载，在即将进入一定范围（上下三屏）时才开始加载"
      },
      "show-menu-by-longpress": {
        "type": 0,
        "status": 2,
        "desc": "长按图片显示发送给朋友、收藏、保存图片、搜一搜、打开名片/前往群聊/打开小程序（若图片中包含对应二维码或小程序码）的菜单。"
      }
    },
    "desc": "支持JPG、PNG、SVG格式，2.3.0 起支持云文件ID。"
  },
  "camera": {
    "type": 0,
    "status": 2,
    "name": "系统相机",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/camera.html",
      "target": ""
    },
    "desc": "扫码二维码功能，需升级微信客户端至6.7.3。需要用户授权 scope.camera。相关api：wx.createCameraContext"
  },
  "video": {
    "status": 1,
    "name": "视频",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/video.html",
      "target": ""
    },
    "props": {
      "page-gesture": {
        "type": 0,
        "status": 2,
        "desc": "在非全屏模式下，是否开启亮度与音量调节手势（废弃，见 vslide-gesture）"
      },
      "show-progress": {
        "type": 0,
        "status": 2,
        "desc": "若不设置，宽度大于240时才会显示"
      },
      "show-fullscreen-btn": {
        "type": 0,
        "status": 2,
        "desc": "是否显示全屏按钮"
      },
      "show-play-btn": {
        "type": 0,
        "status": 2,
        "desc": "是否显示视频底部控制栏的播放按钮"
      },
      "show-center-play-btn": {
        "type": 0,
        "status": 2,
        "desc": "是否显示视频中间的播放按钮"
      },
      "enable-progress-gesture": {
        "type": 0,
        "status": 2,
        "desc": "是否开启控制进度的手势"
      },
      "show-mute-btn": {
        "type": 0,
        "status": 2,
        "desc": "是否显示静音按钮"
      },
      "title": {
        "type": 0,
        "status": 2,
        "desc": "视频的标题，全屏时在顶部展示"
      },
      "play-btn-position": {
        "type": 0,
        "status": 2,
        "desc": "播放按钮的位置"
      },
      "enable-play-gesture": {
        "type": 0,
        "status": 2,
        "desc": "是否开启播放手势，即双击切换"
      },
      "auto-pause-if-navigate": {
        "type": 0,
        "status": 2,
        "desc": "当跳转到本小程序的其他页面时，是否自动暂停本页面的视频播放"
      },
      "auto-pause-if-open-native": {
        "type": 0,
        "status": 2,
        "desc": "当跳转到其它微信原生页面时，是否自动暂停本页面的视频"
      },
      "vslide-gesture": {
        "type": 0,
        "status": 2,
        "desc": "在非全屏模式下，是否开启亮度与音量调节手势（同 page-gesture）"
      },
      "vslide-gesture-in-fullscreen": {
        "type": 0,
        "status": 2,
        "desc": "在全屏模式下，是否开启亮度与音量调节手势"
      },
      "ad-unit-id": {
        "type": 0,
        "status": 2,
        "desc": "视频前贴广告单元ID，更多详情可参考开放能力视频前贴广告"
      },
      "poster-for-crawler": {
        "type": 0,
        "status": 2,
        "desc": "用于给搜索等场景作为视频封面展示，建议使用无播放 icon 的视频封面图，只支持网络地址"
      },
      "show-casting-button": {
        "type": 0,
        "status": 2,
        "desc": "显示投屏按钮。安卓在同层渲染下生效，支持 DLNA 协议；iOS 支持 AirPlay 和 DLNA 协议"
      },
      "picture-in-picture-mode": {
        "type": 0,
        "status": 2,
        "desc": "设置小窗模式： push, pop，空字符串或通过数组形式设置多种模式（如： [push, pop]）"
      },
      "picture-in-picture-show-progress": {
        "type": 0,
        "status": 2,
        "desc": "是否在小窗模式下显示播放进度"
      },
      "enable-auto-rotation": {
        "type": 0,
        "status": 2,
        "desc": "是否开启手机横屏时自动全屏，当系统设置开启自动旋转时生效"
      },
      "show-screen-lock-button": {
        "type": 0,
        "status": 2,
        "desc": "是否显示锁屏按钮，仅在全屏时显示，锁屏后控制栏的操作"
      },
      "show-snapshot-button": {
        "type": 0,
        "status": 2,
        "desc": "是否显示截屏按钮，仅在全屏时显示"
      },
      "show-background-playback-button": {
        "type": 0,
        "status": 2,
        "desc": "是否展示后台音频播放按钮"
      },
      "background-poster": {
        "type": 0,
        "status": 2,
        "desc": "进入后台音频播放后的通知栏图标（Android 独有）"
      },
      "referrer-policy": {
        "type": 0,
        "status": 2,
        "desc": ""
      },
      "is-drm": {
        "type": 0,
        "status": 2,
        "desc": "是否是 DRM 视频源"
      },
      "provision-url": {
        "type": 0,
        "status": 2,
        "desc": "DRM 设备身份认证 url，仅 is-drm 为 true 时生效 (Android)"
      },
      "certificate-url": {
        "type": 0,
        "status": 2,
        "desc": "DRM 设备身份认证 url，仅 is-drm 为 true 时生效 (iOS)"
      },
      "license-url": {
        "type": 0,
        "status": 2,
        "desc": "DRM 获取加密信息 url，仅 is-drm 为 true 时生效"
      }
    },
    "desc": "相关api：wx.createVideoContext"
  },
  "live-player": {
    "name": "实时音视频播放",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "实时音视频播放"
  },
  "live-pusher": {
    "name": "实时音视频录制",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "实时音视频录制"
  },
  "map": {
    "name": "地图",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/map.html",
      "target": ""
    }
  },
  "canvas": {
    "name": "画布",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html",
      "target": ""
    },
    "type": 0,
    "status": 2
  },
  "ad": {
    "name": "Banner 广告",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/ad.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "Banner 广告"
  },
  "official-account": {
    "name": "公众号关注组件",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/official-account.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "当用户扫小程序码打开小程序时，开发者可在小程序内配置公众号关注组件，方便用户快捷关注公众号，可嵌套在原生组件内"
  },
  "open-data": {
    "name": "用于展示微信开放的数据",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/open-data.html",
      "target": ""
    },
    "type": 0,
    "status": 2,
    "desc": "用于展示微信开放的数据"
  },
  "web-view": {
    "status": 1,
    "name": "组件用于承载 H5 网页，自动铺满整个小程序页面",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html",
      "target": ""
    },
    "props": {
      "bindmessage": {
        "type": 0,
        "status": 2,
        "desc": "网页向小程序 postMessage 时，会在特定时机（小程序后退、组件销毁、分享）触发并收到消息。e.detail = { data }，data是多次 postMessage 的参数组成的数组"
      }
    },
    "desc": "会自动铺满整个小程序页面，个人类型的小程序暂不支持使用。客户端 6.7.2 版本开始，navigationStyle: custom 对 web-view 组件无效"
  }
} as Record<string, Rule>;

export const globalconfig = {
  "pages": {
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#pages",
      "target": ""
    },
    "type": 7,
    "status": 0,
    "desc": "设置页面路径"
  },
  "window": {
    "name": "用于对小程序进行全局配置，设置页面文件的路径、窗口表现、网络超时时间、多 tab 等",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window",
      "target": ""
    },
    "desc": "window 用于设置小程序的状态栏、导航条、标题、窗口背景色等。",
    "status": 1,
    "props": {
      "navigationBarBackgroundColor": {
        "type": 7,
        "status": 0,
        "desc": "页面的背景色"
      },
      "navigationBarTitleText": {
        "type": 7,
        "status": 0,
        "desc": "页面默认标题"
      },
      "enablePullDownRefresh": {
        "type": 7,
        "status": 0,
        "desc": "是否允许下拉刷新。默认NO"
      },
      "navigationStyle": {
        "type": 7,
        "status": 0,
        "desc": "导航栏样式"
      },
      "backgroundColor": {
        "type": 7,
        "status": 0,
        "desc": "窗口的背景色"
      },
      "navigationBarTextStyle": {
        "type": 7,
        "status": 0,
        "desc": "导航栏标题颜色，仅支持 black / white",
        "msg": "暂不支持"
      },
      "backgroundTextStyle": {
        "type": 0,
        "status": 2,
        "desc": "下拉 loading 的样式，仅支持 dark / light",
        "msg": "暂不支持"
      },
      "backgroundColorTop": {
        "type": 0,
        "status": 2,
        "desc": "顶部窗口的背景色，仅 iOS 支持",
        "msg": "暂不支持"
      },
      "backgroundColorBottom": {
        "type": 0,
        "status": 2,
        "desc": "底部窗口的背景色，仅 iOS 支持",
        "msg": "暂不支持"
      },
      "onReachBottomDistance": {
        "type": 0,
        "status": 2,
        "desc": "页面上拉触底事件触发时距页面底部距离，单位为 px",
        "msg": "暂不支持"
      },
      "pageOrientation": {
        "type": 0,
        "status": 2,
        "desc": "屏幕旋转设置，支持 auto / portrait / landscape",
        "msg": "暂不支持"
      }
    }
  },
  "tabBar": {
    "status": 1,
    "name": "底部 tab 栏的表现",
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#tabBar",
      "target": ""
    },
    "desc": "如果小程序是一个多 tab 应用（客户端窗口的底部或顶部有 tab 栏可以切换页面），可以通过 tabBar 配置项指定 tab 栏的表现，以及 tab 切换时显示的对应页面。",
    "props": {
      "color": {
        "type": 7,
        "status": 0,
        "desc": "tab 上的文字默认颜色，仅支持十六进制颜色"
      },
      "selectedColor": {
        "type": 7,
        "status": 0,
        "desc": "选中文字颜色"
      },
      "backgroundColor": {
        "type": 7,
        "status": 0,
        "desc": "tab 的背景色，仅支持十六进制颜色"
      },
      "borderStyle": {
        "type": 7,
        "status": 0,
        "desc": "tabbar 上边框的颜色， 仅支持 black / white"
      },
      "list": {
        "type": 7,
        "status": 0,
        "desc": "tab 的列表，详见 list 属性说明，最少 2 个、最多 5 个 tab"
      },
      "position": {
        "type": 0,
        "status": 2,
        "desc": "tabBar 的位置，仅支持 bottom / top"
      },
      "custom": {
        "type": 0,
        "status": 2,
        "desc": "自定义 tabBar"
      }
    }
  },
  "usingComponents": {
    "name": "全局自定义组件配置",
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#usingComponents",
      "target": ""
    },
    "desc": "在此处声明的自定义组件视为全局自定义组件，在小程序内的页面或自定义组件中可以直接使用而无需再声明。"
  },
  "networkTimeout": {
    "name": "网络超时时间",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#networkTimeout",
      "target": ""
    },
    "desc": "各类网络请求的超时时间，单位均为毫秒。"
  },
  "debug": {
    "name": "是否开启 debug 模式，默认关闭",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#debug",
      "target": ""
    },
    "desc": "可以在开发者工具中开启 debug 模式，在开发者工具的控制台面板，调试信息以 info 的形式给出，其信息有 Page 的注册，页面路由，数据更新，事件触发等。可以帮助开发者快速定位一些常见的问题"
  },
  "functionalPages": {
    "name": "是否启用插件功能页，默认关闭",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#functionalPages",
      "target": ""
    },
    "desc": "插件所有者小程序需要设置这一项来启用插件功能页。"
  },
  "subpackages": {
    "name": "分包结构配置",
    "status": 1,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#subpackages",
      "target": ""
    },
    "props": {
      "root": {
        "type": 7,
        "status": 0,
        "desc": "分包根目录"
      },
      "name": {
        "type": 0,
        "status": 2,
        "desc": "分包别名，分包预下载时可以使用"
      },
      "pages": {
        "type": 7,
        "status": 0,
        "desc": "分包页面路径，相对与分包根目录"
      },
      "independent": {
        "type": 0,
        "status": 2,
        "desc": "分包是否是独立分包"
      }
    },
    "desc": "启用分包加载时，声明项目分包结构。"
  },
  "workers": {
    "name": "Worker 代码放置的目录",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#workers",
      "target": ""
    },
    "desc": "使用 Worker 处理多线程任务时，设置 Worker 代码放置的目录"
  },
  "requiredBackgroundModes": {
    "name": "需要在后台使用的能力，如「音乐播放」",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#requiredBackgroundModes",
      "target": ""
    },
    "desc": "申明需要后台运行的能力，类型为数组。目前支持以下项目：audio后台音乐播放"
  },
  "plugins": {
    "name": "使用到的插件",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#plugins",
      "target": ""
    },
    "desc": "声明小程序需要使用的插件。"
  },
  "preloadRule": {
    "name": "分包预下载规则",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#preloadRule",
      "target": ""
    },
    "desc": "声明分包预下载的规则"
  },
  "resizable": {
    "name": "iPad 小程序是否支持屏幕旋转，默认关闭",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#resizable",
      "target": ""
    },
    "desc": "在 iPad 上运行的小程序可以设置支持屏幕旋转。"
  },
  "navigateToMiniProgramAppIdList": {
    "name": "需要跳转的小程序列表，详见 wx.navigateToMiniProgram",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#navigateToMiniProgramAppIdList",
      "target": ""
    },
    "desc": "当小程序需要使用 wx.navigateToMiniProgram 接口跳转到其他小程序时，需要先在配置文件中声明需要跳转的小程序 appId 列表，最多允许填写 10 个"
  },
  "permission": {
    "name": "小程序接口权限相关设置",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#permission",
      "target": ""
    },
    "desc": "小程序接口权限相关设置。字段类型为 Object"
  },
  "sitemapLocation": {
    "name": "指明 sitemap.json 的位置",
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#sitemapLocation",
      "target": ""
    },
    "desc": "指明 sitemap.json 的位置"
  }
} as Record<string, Rule>;

export const pageconfig = {
  "navigationBarBackgroundColor": {
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "导航栏背景颜色，如 #000000"
  },
  "navigationBarTextStyle": {
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "导航栏标题颜色，仅支持 black / white"
  },
  "navigationBarTitleText": {
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "导航栏标题文字内容"
  },
  "navigationStyle": {
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "导航栏样式，仅支持以下值，default 默认样式,custom 自定义导航栏，只保留右上角胶囊按钮"
  },
  "enablePullDownRefresh": {
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "是否开启当前页面下拉刷新。详见 Page.onPullDownRefresh"
  },
  "usingComponents": {
    "type": 7,
    "status": 0,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "页面自定义组件配置"
  },
  "backgroundColor": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "窗口的背景色"
  },
  "backgroundTextStyle": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "下拉 loading 的样式，仅支持 dark / light"
  },
  "backgroundColorTop": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "顶部窗口的背景色，仅 iOS 支持"
  },
  "backgroundColorBottom": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "底部窗口的背景色，仅 iOS 支持"
  },
  "onReachBottomDistance": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "页面上拉触底事件触发时距页面底部距离，单位为px。详见 Page.onReachBottom"
  },
  "pageOrientation": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "屏幕旋转设置，支持 auto / portrait / landscape 详见 响应显示区域变化"
  },
  "disableScroll": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "设置为 true 则页面整体不能上下滚动。只在页面配置中有效，无法在 app.json 中设置"
  },
  "disableSwipeBack": {
    "type": 0,
    "status": 2,
    "url": {
      "original": "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
      "target": ""
    },
    "desc": "禁止页面右滑手势返回"
  }
} as Record<string, Rule>;
