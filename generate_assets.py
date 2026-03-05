from PIL import Image, ImageDraw

def create_sprite(filename, size, color, grid=None):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if grid:
        # It's a sprite sheet
        w, h = size
        cols, rows = grid
        cell_w, cell_h = w // cols, h // rows
        for i in range(cols):
            for j in range(rows):
                x0, y0 = i * cell_w, j * cell_h
                x1, y1 = x0 + cell_w, y0 + cell_h
                # Give alternate colors to simulate animation frames
                frame_color = color if (i+j)%2 == 0 else tuple(max(0, c-40) for c in color)
                draw.rectangle([x0, y0, x1, y1], fill=frame_color, outline=(0,0,0,255), width=2)
    else:
        # It's a single sprite
        draw.rectangle([0, 0, size[0], size[1]], fill=color, outline=(0,0,0,255), width=2)

    img.save(filename)

if __name__ == "__main__":
    # Generate player sprite sheet: 128x128 for 4x4 frames of 32x32 each
    create_sprite('assets/player_sheet.png', (128, 128), (57, 255, 20, 255), grid=(4, 4))

    # Generate project station sprite
    create_sprite('assets/station.png', (48, 48), (255, 204, 0, 255))

    # Generate flask sprite
    create_sprite('assets/flask.png', (32, 32), (0, 216, 255, 255))

    print("Placeholder assets generated.")
