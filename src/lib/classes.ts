// Copyright: Ankitects Pty Ltd and contributors
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html
// Modified by zSnout to return a class name instead of adding it to DOM root

// TODO: this file isn't used

export function getClasses() {
  if (typeof navigator == "undefined") {
    return ""
  }

  const ua = navigator.userAgent.toLowerCase()

  let output = ""

  function addClass(className: string) {
    output += className
  }

  function test(regex: RegExp): boolean {
    return regex.test(ua)
  }

  if (test(/ipad/)) {
    addClass("ipad")
  } else if (test(/iphone/)) {
    addClass("iphone")
  } else if (test(/android/)) {
    addClass("android")
  }

  if (test(/ipad|iphone|ipod/)) {
    addClass("ios")
  }

  if (test(/ipad|iphone|ipod|android/)) {
    addClass("mobile")
  } else if (test(/linux/)) {
    addClass("linux")
  } else if (test(/windows/)) {
    addClass("win")
  } else if (test(/mac/)) {
    addClass("mac")
  }

  if (test(/firefox\//)) {
    addClass("firefox")
  } else if (test(/chrome\//)) {
    addClass("chrome")
  } else if (test(/safari\//)) {
    addClass("safari")
  }

  return output
}
