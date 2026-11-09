"""Inline ReportLab section tabs matching note-section-headings.css at print size."""
import re

from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth

REFERENCE = re.compile(r'\bSection ([A-E])\b', re.IGNORECASE)
TAB_FONT = 'MonoBold'  # Embedded IBM Plex Mono SemiBold, also used on the note front.
TAB_SIZE = 9
TAB_HEIGHT = 12.75
TAB_INK = HexColor('#202020')


def tab_text(letter):
    # The surrounding padding and the internal space move together at a line break.
    return f'\u00a0SECTION\u00a0{letter.upper()}\u00a0'


def section_tab_markup(text):
    def replace(match):
        letter = match[1].upper()
        # Punctuation immediately after a tab needs its own small print gutter.
        following = match.string[match.end():match.end() + 1]
        gutter = '<font name="MonoBold" size="5">\u00a0</font>' if following and following in '.,:;!?)]' else ''
        return (f'<font name="{TAB_FONT}" size="{TAB_SIZE}" color="#ffffff">{tab_text(letter)}</font>'
                f'<onDraw name="section_tab_background" label="{letter}"/>{gutter}')
    # Earlier readings already mark the reference as bold.
    text = re.sub(r'<b>(Section [A-E])</b>', r'\1', text, flags=re.IGNORECASE)
    return REFERENCE.sub(replace, text)


def draw_section_tab_background(canvas, kind, letter):
    # At the end of the inline label, the callback uses its final wrapped position.
    # Paragraph paints the text object after drawing these background rectangles.
    cursor = canvas._curr_tx_info
    advance = stringWidth(tab_text(letter), TAB_FONT, TAB_SIZE)
    canvas.saveState()
    canvas.setFillColor(TAB_INK)
    canvas.rect(cursor['cur_x'] - advance + 0.45, cursor['cur_y'] - 3.1,
                advance - 0.9, TAB_HEIGHT, stroke=0, fill=1)
    canvas.restoreState()
