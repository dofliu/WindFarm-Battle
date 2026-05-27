#!/usr/bin/env python3
"""
WindFarm Battle — App icon & splash 生成腳本
繪製風力發電機主題圖示，產生 Android 所有 DPI 規格
執行：python3 scripts/generate_icons.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ANDROID_RES = "android/app/src/main/res"

# ── 顏色主題（Cumulus 主題：深藍 + 天空藍）──────────────────────────────
BG_DARK   = (28, 42, 58)       # #1c2a3a
BG_MID    = (13, 25, 36)       # #0d1924
ACCENT    = (58, 167, 200)     # #3aa7c8
WHITE     = (255, 255, 255)
GOLD      = (244, 214, 138)    # #f4d68a（Tideboard 金色）
SKY_LIGHT = (216, 236, 244)    # #d8ecf4


def draw_turbine(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float,
                 tower_color=WHITE, blade_color=WHITE, hub_color=ACCENT,
                 alpha: int = 255) -> None:
    """在 (cx, cy) 中心繪製風力發電機，size 為整體高度。"""
    tower_w = size * 0.07
    tower_h = size * 0.45
    # 塔柱（梯形）
    tower_top_w = tower_w * 0.6
    tower_pts = [
        (cx - tower_top_w / 2, cy - tower_h * 0.05),
        (cx + tower_top_w / 2, cy - tower_h * 0.05),
        (cx + tower_w / 2, cy + tower_h),
        (cx - tower_w / 2, cy + tower_h),
    ]
    draw.polygon(tower_pts, fill=(*tower_color, alpha))

    # 機艙（小矩形）
    nacelle_w = size * 0.14
    nacelle_h = size * 0.07
    nx = cx - nacelle_w * 0.3
    ny = cy - tower_h * 0.05 - nacelle_h
    draw.rounded_rectangle(
        [nx, ny, nx + nacelle_w, ny + nacelle_h],
        radius=nacelle_h * 0.3,
        fill=(*tower_color, alpha),
    )

    # 三片葉片（120° 間隔）
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
        draw.polygon(blade_pts, fill=(*blade_color, alpha))

    # 輪轂（圓心）
    draw.ellipse(
        [hub_cx - hub_r, hub_cy - hub_r, hub_cx + hub_r, hub_cy + hub_r],
        fill=(*hub_color, alpha),
    )


def make_icon(size: int) -> Image.Image:
    """生成正方形 App icon，背景深藍漸層 + 白色風力機 + 金色光暈。"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 圓角矩形背景（漸層用兩個矩形疊加模擬）
    radius = size * 0.22
    # 底色
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(*BG_DARK, 255))
    # 上方淡藍漸層（用半透明矩形疊加）
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    for y in range(size // 2):
        alpha = int(40 * (1 - y / (size / 2)))
        ov_draw.line([(0, y), (size, y)], fill=(*ACCENT, alpha))
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    # 金色光暈（在風力機後方）
    glow_r = size * 0.28
    glow_cx = size * 0.5
    glow_cy = size * 0.38
    for r in range(int(glow_r), 0, -1):
        alpha = int(30 * (1 - r / glow_r))
        draw.ellipse(
            [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
            outline=(*GOLD, alpha),
        )

    # 風力機
    draw_turbine(
        draw,
        cx=size * 0.5,
        cy=size * 0.42,
        size=size * 0.72,
        tower_color=WHITE,
        blade_color=WHITE,
        hub_color=ACCENT,
    )

    # 底部文字（只在大尺寸才加）
    if size >= 144:
        try:
            font_size = max(int(size * 0.09), 8)
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()
        text = "WINDFARM"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        tx = (size - tw) / 2
        ty = size * 0.84
        draw.text((tx, ty), text, font=font, fill=(*GOLD, 220))

    return img


def make_splash(width: int, height: int) -> Image.Image:
    """生成啟動畫面：深藍背景 + 中央大風力機 + 品牌文字。"""
    img = Image.new("RGBA", (width, height), (*BG_DARK, 255))
    draw = ImageDraw.Draw(img)

    # 背景：上 35% 為天空藍，其餘深藍
    sky_h = int(height * 0.35)
    for y in range(sky_h):
        # 由上往下從 ACCENT 漸變到 BG_DARK
        t = y / sky_h
        r = int(ACCENT[0] * (1 - t) + BG_DARK[0] * t)
        g = int(ACCENT[1] * (1 - t) + BG_DARK[1] * t)
        b = int(ACCENT[2] * (1 - t) + BG_DARK[2] * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # 金色光暈（在風力機葉片後方）
    glow_cx = width * 0.5
    glow_cy = height * 0.36
    glow_r = min(width, height) * 0.25
    for r in range(int(glow_r), 0, -1):
        alpha = int(45 * (1 - r / glow_r))
        draw.ellipse(
            [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
            outline=(*GOLD, alpha),
        )

    # 風力機（偏上，讓下方有足夠空間放文字）
    turbine_size = min(width, height) * 0.58
    draw_turbine(
        draw,
        cx=width * 0.5,
        cy=height * 0.38,
        size=turbine_size,
        tower_color=WHITE,
        blade_color=WHITE,
        hub_color=ACCENT,
    )

    # 品牌文字
    try:
        font_lg = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            max(int(min(width, height) * 0.072), 14),
        )
        font_sm = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            max(int(min(width, height) * 0.036), 9),
        )
    except Exception:
        font_lg = ImageFont.load_default()
        font_sm = font_lg

    # 計算風力機塔柱底部 Y 座標
    # 塔柱高度 = turbine_size * 0.45，中心在 height*0.38，塔柱底部在中心 + 塔柱高度
    turbine_bottom_y = height * 0.38 + turbine_size * 0.45
    text_start_y = turbine_bottom_y + height * 0.06

    title = "WINDFARM BATTLE"
    bbox = draw.textbbox((0, 0), title, font=font_lg)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((width - tw) / 2, text_start_y), title, font=font_lg, fill=(*GOLD, 240))

    subtitle = "Wind Energy O&M Strategy Card Game"
    bbox2 = draw.textbbox((0, 0), subtitle, font=font_sm)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(((width - tw2) / 2, text_start_y + th + height * 0.025), subtitle, font=font_sm, fill=(*WHITE, 160))

    # 底部 DOF Lab 標記
    try:
        font_xs = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            max(int(min(width, height) * 0.026), 7),
        )
    except Exception:
        font_xs = font_sm
    lab = "DOF LAB · NCUT"
    bbox3 = draw.textbbox((0, 0), lab, font=font_xs)
    tw3 = bbox3[2] - bbox3[0]
    draw.text(((width - tw3) / 2, height * 0.94), lab, font=font_xs, fill=(*ACCENT, 140))

    return img.convert("RGB")


def main():
    # ── Android icon 各 DPI ─────────────────────────────────────────────
    dpi_sizes = {
        "mipmap-mdpi":    48,
        "mipmap-hdpi":    72,
        "mipmap-xhdpi":   96,
        "mipmap-xxhdpi":  144,
        "mipmap-xxxhdpi": 192,
    }
    for dpi, size in dpi_sizes.items():
        icon = make_icon(size)
        out_dir = f"{ANDROID_RES}/{dpi}"
        os.makedirs(out_dir, exist_ok=True)
        # ic_launcher（帶圓角背景）
        icon.save(f"{out_dir}/ic_launcher.png")
        # ic_launcher_round（圓形裁切）
        round_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size, size], fill=255)
        round_img.paste(icon, (0, 0), mask)
        round_img.save(f"{out_dir}/ic_launcher_round.png")
        # ic_launcher_foreground（前景層，透明背景）
        fg = make_icon(size)
        fg.save(f"{out_dir}/ic_launcher_foreground.png")
        print(f"  ✅ {dpi}: {size}×{size}")

    # ── Android splash（各方向）────────────────────────────────────────
    splash_sizes = {
        "drawable":           (480, 320),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (1080, 1920),
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1920, 1080),
    }
    for folder, (w, h) in splash_sizes.items():
        splash = make_splash(w, h)
        out_dir = f"{ANDROID_RES}/{folder}"
        os.makedirs(out_dir, exist_ok=True)
        splash.save(f"{out_dir}/splash.png")
        print(f"  ✅ {folder}: {w}×{h}")

    print("\n🎉 全部圖片生成完成！")


if __name__ == "__main__":
    main()
