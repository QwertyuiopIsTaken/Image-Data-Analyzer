import tkinter as tk
from tkinter import ttk

class ScrollableFrame(tk.Frame):
    def __init__(self, parent, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)

        # Create canvas and scrollbar
        self.canvas = tk.Canvas(self, bg = "#DDDDDD")
        self.scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)

        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)

        # Create internal frame inside canvas
        self.inner = tk.Frame(self.canvas, bg = "#DDDDDD")
        self.window = self.canvas.create_window((0, 0), window = self.inner, anchor="nw")
        self.canvas.bind("<Configure>", self._on_canvas_configure)

        # Bind to update scrollregion when inner frame changes
        self.inner.bind("<Configure>", self._on_frame_configure)

        # Mousewheel bindings
        self.canvas.bind("<Enter>", self._bind_mousewheel)
        self.canvas.bind("<Leave>", self._unbind_mousewheel)

    # Make inner frame span the full width of the canvas
    def _on_canvas_configure(self, event):
        self.canvas.itemconfig(self.window, width=event.width)
    
    # Adjust scrollregion when widgets change size
    def _on_frame_configure(self, event):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    # Enable scroll only when mouse is over the widget
    def _bind_mousewheel(self, event):
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)
        self.canvas.bind_all("<Button-4>", self._on_mousewheel)
        self.canvas.bind_all("<Button-5>", self._on_mousewheel)

    # Disable scroll when mouse leaves widget
    def _unbind_mousewheel(self, event):
        self.canvas.unbind_all("<MouseWheel>")
        self.canvas.unbind_all("<Button-4>")
        self.canvas.unbind_all("<Button-5>")

    # Platform-aware scrolling
    def _on_mousewheel(self, event):
        if event.num in (4, 5):  # Linux
            direction = -1 if event.num == 4 else 1
            self.canvas.yview_scroll(direction, "units")
        else:
            self.canvas.yview_scroll(int(-event.delta / 120), "units")

    
if __name__ == "__main__":
    root = tk.Tk()
    root.title("Scrollable Frame Example")
    root.geometry("500x300")

    frame1 = ScrollableFrame(root)
    frame1.pack(side="left", fill="both", expand=True, padx=5, pady=5)

    frame2 = ScrollableFrame(root)
    frame2.pack(side="right", fill="both", expand=True, padx=5, pady=5)

    # Add widgets to frame1
    for i in range(20):
        ttk.Label(frame1.inner, text=f"Frame 1 Label {i+1}").pack(pady=3)

    # Add widgets to frame2
    for i in range(30):
        ttk.Button(frame2.inner, text=f"Click {i+1}").pack(pady=3)

    root.mainloop()


