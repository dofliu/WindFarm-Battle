#!/usr/bin/env python3
"""
WindFarm Battle — iOS App icon & splash 生成腳本
與 Android 相同的風力發電機主題，產生 iOS 所需規格
執行：python3 scripts/generate_ios_icons.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

IOS_ASSETS = "ios/App/App/Assets.xcassets"

# ── 顏色主題（與 Android 相同）──────────────────────────────────────────
BG_DARK   = (28, 42, 58)       # #1c2a3a
ACCENT    = (58, 167, 200)     # #3aa7c8
WHITE     = (255, 255, 255)
GOLD      = (244, 214, 138)    # #f4d68a


def draw_turbine(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float,
                 tower_color=WHITE, blade_color=WHITE, hub_color=ACCENT) -> None:
    """在 (cx, cy) 中心繪製風力發電機，size 為整體高度。"""
    tower_w = size * 0.07
    tower_h = size * 0.45
    tower_top_w = tower_w * 0.6
    tower_pts = [
        (cx - tower_top_w / 2, cy - tower_h * 0.05),
        (cx + tower_top_w / 2, cy - tower_h * 0.05),
        (cx + tower_w / 2, cy + tower_h),
        (cx - tower_w / 2, cy + tower_h),
    ]
    draw.polygon(tower_pts, fill=(*tower_color, 255))

    nacelle_w = size * 0.14
    nacelle_h = size * 0.07
    nx = cx - nacelle_w * 0.3
    ny = cy - tower_h * 0.05 - nacelle_h
    draw.rounded_rectangle(
        [nx, ny, nx + nacelle_w, ny + nacelle_h],
        radius=nacelle_h * 0.3,
        fill=(*tower_color, 255),
    )

    hub_r = size * 0.05
    blade_len = size * 0.38
    blade_w = size * 0.055
    hub_cx = cx
    hub_cy = cy - tower_h * 0.05 - nacelle_h * 0.5

    for i in range(3):
        angle = math.radians(90 + i * 120)
        tip_x = hub_cx + blade_len * math.cos(angle)
        tip_y = hub_cy - blade_len * math.sin(angle)
        perp = math.radians(angle + math.pi / 2)
        dx = blade_w * 0.5 * math.cos(perp)
        dy = blade_w * 0.5 * math.sin(perp)
        blade_pts = [
            (hub_cx + dx, hub_cy + dy),
            (hub_cx - dx, hub_cy - dy),
            (tip_x, tip_y),
        ]
        draw.polygon(blade_pts, fill=(*blade_color, 255))

    draw.ellipse(
        [hub_cx - hub_r, hub_cy - hub_r, hub_cx + hub_r, hub_cy + hub_r],
        fill=(*hub_color, 255),
    )


def make_ios_icon(size: int) -> Image.Image:
    """
    iOS App icon：無圓角（iOS 系統自動裁切），1024×1024 為 App Store 標準。
    注意：iOS icon 不可有透明像素，必須是純 RGB。
    """
    img = Image.new("RGBA", (size, size), (*BG_DARK, 255))
    draw = ImageDraw.Draw(img)

    # 上方天空藍漸層
    sky_h = int(size * 0.4)
    for y in range(sky_h):
        t = y / sky_h
        r = int(ACCENT[0] * (1 - t) + BG_DARK[0] * t)
        g = int(ACCENT[1] * (1 - t) + BG_DARK[1] * t)
        b = int(ACCENT[2] * (1 - t) + BG_DARK[2] * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # 金色光暈
    glow_cx = size * 0.5
    glow_cy = size * 0.42
    glow_r = size * 0.3
    for r in range(int(glow_r), 0, -1):
        alpha = int(50 * (1 - r / glow_r))
        draw.ellipse(
            [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
            outline=(*GOLD, alpha),
        )

    # 風力機
    draw_turbine(
        draw,
        cx=size * 0.5,
        cy=size * 0.44,
        size=size * 0.72,
    )

    # 底部文字（只在大尺寸才加）
    if size >= 512:
        try:
            font_size = max(int(size * 0.075), 12)
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size
            )
        except Exception:
            font = ImageFont.load_default()
        text = "WINDFARM"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((size - tw) / 2, size * 0.84), text, font=font, fill=(*GOLD, 220))

    # iOS icon 必須是 RGB（無透明）
    return img.convert("RGB")


def make_ios_splash(size: int) -> Image.Image:
    """
    iOS splash：2732×2732 正方形（Capacitor 標準），居中構圖。
    """
    img = Image.new("RGBA", (size, size), (*BG_DARK, 255))
    draw = ImageDraw.Draw(img)

    # 背景：上 35% 天空藍漸層
    sky_h = int(size * 0.35)
    for y in range(sky_h):
        t = y / sky_h
        r = int(ACCENT[0] * (1 - t) + BG_DARK[0] * t)
        g = int(ACCENT[1] * (1 - t) + BG_DARK[1] * t)
        b = int(ACCENT[2] * (1 - t) + BG_DARK[2] * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # 金色光暈
    glow_cx = size * 0.5
    glow_cy = size * 0.36
    glow_r = size * 0.25
    for r in range(int(glow_r), 0, -1):
        alpha = int(45 * (1 - r / glow_r))
        draw.ellipse(
            [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
            outline=(*GOLD, alpha),
        )

    # 風力機
    turbine_size = size * 0.58
    draw_turbine(
        draw,
        cx=size * 0.5,
        cy=size * 0.38,
        size=turbine_size,
    )

    # 品牌文字
    try:
        font_lg = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            max(int(size * 0.072), 14),
        )
        font_sm = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            max(int(size * 0.036), 9),
        )
        font_xs = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            max(int(size * 0.026), 7),
        )
    except Exception:
        font_lg = ImageFont.load_default()
        font_sm = font_lg
        font_xs = font_lg

    # 計算文字位置（緊接在塔柱底部以下）
    turbine_bottom_y = size * 0.38 + turbine_size * 0.45
    text_start_y = turbine_bottom_y + size * 0.06

    title = "WINDFARM BATTLE"
    bbox = draw.textbbox((0, 0), title, font=font_lg)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, text_start_y), title, font=font_lg, fill=(*GOLD, 240))

    subtitle = "Wind Energy O&M Strategy Card Game"
    bbox2 = draw.textbbox((0, 0), subtitle, font=font_sm)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(
        ((size - tw2) / 2, text_start_y + th + size * 0.025),
        subtitle, font=font_sm, fill=(*WHITE, 160)
    )

    lab = "DOF LAB · NCUT"
    bbox3 = draw.textbbox((0, 0), lab, font=font_xs)
    tw3 = bbox3[2] - bbox3[0]
    draw.text(((size - tw3) / 2, size * 0.94), lab, font=font_xs, fill=(*ACCENT, 140))

    return img.convert("RGB")


def main():
    # ── iOS App icon ─────────────────────────────────────────────────────
    # Capacitor iOS 只需要 AppIcon-512@2x.png（1024×1024）
    # 同時也產生常用的小尺寸備用
    icon_sizes = {
        "AppIcon-512@2x.png": 1024,   # App Store / 主圖示
        "AppIcon-60@3x.png":  180,    # iPhone @3x
        "AppIcon-60@2x.png":  120,    # iPhone @2x
        "AppIcon-76@2x.png":  152,    # iPad @2x
        "AppIcon-83.5@2x.png": 167,   # iPad Pro @2x
        "AppIcon-20@3x.png":  60,     # Notification @3x
        "AppIcon-20@2x.png":  40,     # Notification @2x
        "AppIcon-29@3x.png":  87,     # Settings @3x
        "AppIcon-29@2x.png":  58,     # Settings @2x
        "AppIcon-40@3x.png":  120,    # Spotlight @3x（同 60@2x）
        "AppIcon-40@2x.png":  80,     # Spotlight @2x
    }
    icon_dir = f"{IOS_ASSETS}/AppIcon.appiconset"
    os.makedirs(icon_dir, exist_ok=True)
    for filename, size in icon_sizes.items():
        icon = make_ios_icon(size)
        icon.save(f"{icon_dir}/{filename}")
        print(f"  ✅ {filename}: {size}×{size}")

    # ── iOS Splash（2732×2732 × 3 份，Capacitor 標準）───────────────────
    splash_dir = f"{IOS_ASSETS}/Splash.imageset"
    os.makedirs(splash_dir, exist_ok=True)
    splash = make_ios_splash(2732)
    for filename in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
        splash.save(f"{splash_dir}/{filename}")
        print(f"  ✅ {filename}: 2732×2732")

    print("\n🎉 iOS 全部圖片生成完成！")


if __name__ == "__main__":
    main()
