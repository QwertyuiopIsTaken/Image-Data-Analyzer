import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
from tkinter import filedialog
from tkinter.constants import *
from frontend.scrollableframe import ScrollableFrame
from PIL import Image, ImageTk, ImageOps
from pathlib import Path
import subprocess

root = tk.Tk()
pixel = tk.PhotoImage(width = 1, height = 1)
selectedImages = list()
selectedAPI = ""

def openImageFileDialog(callback):
    filepaths = filedialog.askopenfilenames(
        initialdir = "/Pictures",
        title = "Select image files",
        filetypes = (
            ("Image Files", "*.png *.jpg *.jpeg"),
        )
    )

    if filepaths:
        print("Selected files:", filepaths)
        callback(filepaths)

def openJSONFileDialog(callback):
    filepath = filedialog.askopenfilename(
        initialdir = "/Documents",
        title = "Select API JSON file",
        filetype = (
            ("JSON Files", "*.json"),
        )
    )

    if filepath:
        print("JSON file selected")
        callback(filepath)

def main():
    windowWidth = 800
    windowHeight = 560

    root.minsize(600, 420)
    root.geometry(f"{windowWidth}x{windowHeight}")
    root.title("Text OCR Scanner")

    icon = tk.PhotoImage(file = "frontend/assets/imageicon.png")
    root.iconphoto(True, icon)

    scrollFrame = ScrollableFrame(root)
    scrollFrame.pack(side = "top", fill = "both", expand = True, padx = 5, pady = 5)

    bottomFrame = tk.Frame(root)
    bottomFrame.pack(side = "bottom", fill = "x", padx = 5, pady = 5)

    apiLabel = tk.Label(bottomFrame, text = "API Key (JSON): Not selected", fg = "black", font = ("Lexend", 10))
    apiLabel.place(anchor = "sw", relx = 0, rely = 1)

    # Displays whether API is Selected or not
    def changeAPIStatus(filepath):
        global selectedAPI
        apiLabel.config(text = "API Key (JSON): Selected")
        selectedAPI = filepath

    # Download and clear buttons
    def download():
        if not selectedImages:
            messagebox.showwarning("No images", "Please import images first.")
            return
        
        if not selectedAPI:
            messagebox.showwarning("No API key", "Please select an API key JSON file first.")
            return

        try:
            command = ["node", "backend/ocr.js", selectedAPI] + selectedImages
            subprocess.run(command, check = True)

            messagebox.showinfo("Download successful", "CSV file generated successfully!")

        except subprocess.CalledProcessError as e:
            messagebox.showerror("Error", str(e))

    def clear():
        selectedImages.clear()
        for widget in scrollFrame.inner.winfo_children():
            widget.destroy()

        scrollFrame.inner.update_idletasks()

    downloadButton = tk.Button(bottomFrame, font = ("Franklin Gothic Book", 16), text = "Export to CSV file",  image = pixel, 
                               compound = "center", relief = "groove", borderwidth = 3, command = download, bg = "green", activebackground = "dark green")
    downloadButton.pack(pady = 5)
    clearButton = tk.Button(bottomFrame, font = ("Franklin Gothic Book", 16), text = "Clear",  image = pixel, 
                            compound = "center", relief = "groove", borderwidth = 3, command = clear, bg = "red", activebackground = "dark red")
    clearButton.pack(pady = 5)

    # Dynamic sizing
    def on_frame_resize(event):
        newWidth = event.width // 3
        downloadButton.config(width = newWidth)
        clearButton.config(width = newWidth)

    bottomFrame.bind('<Configure>', on_frame_resize)

    # Manages scroll frame
    columns = 5
    for col in range(columns):
        scrollFrame.inner.grid_columnconfigure(col, weight = 1, uniform = "fred")

    def updateFrame(filepaths):
        global selectedImages
        currentFiles = len(selectedImages)

        for i, image_path in enumerate(filepaths):
            imageFrame = tk.Frame(scrollFrame.inner)

            row = (currentFiles + i) // columns
            col = (currentFiles + i) % columns
           
            imageFrame.grid(row = row, column = col, padx = 10, pady = 10, sticky = "nsew")

            file_name = Path(image_path).name
            fileNameLabel = tk.Label(imageFrame, text = file_name, font = ("Franklin Gothic Book", 10), wraplength = 100, justify = "center")
            fileNameLabel.pack(side = "bottom")

            pil_image = Image.open(image_path)
            pil_image = ImageOps.exif_transpose(pil_image)
            pil_image.thumbnail((200, 300), Image.Resampling.LANCZOS)
            resized_image = pil_image

            thumbnail = ImageTk.PhotoImage(resized_image)

            imageLabel = tk.Label(imageFrame, image = thumbnail)
            imageLabel.image = thumbnail
            imageLabel.pack(side ="top")

        selectedImages.extend(filepaths)

    menubar = tk.Menu(root, relief = "groove")

    fileMenu = tk.Menu(menubar, tearoff = 0, font = ("Verdana", 8))
    fileMenu.add_command(label = "Import", command = lambda: openImageFileDialog(updateFrame))

    apiMenu = tk.Menu(menubar, tearoff = 0, font = ("Verdana", 8))
    apiMenu.add_command(label = "Select API", command = lambda: openJSONFileDialog(changeAPIStatus))

    menubar.add_cascade(label = "File", menu = fileMenu, font = ("Verdana", 8))
    menubar.add_cascade(label = "API", menu = apiMenu, font = ("Verdana", 8))

    root.config(menu = menubar)

    root.mainloop()

main()