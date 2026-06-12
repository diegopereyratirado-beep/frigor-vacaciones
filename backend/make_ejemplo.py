# Genera el archivo de ejemplo para probar la importación de empleados.
from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.append(["Nombre", "Área", "FechaIngreso", "DíasUsados"])
ws.append(["Marcelo Antelo", "Producción", "2023-06-12", 1])
ws.append(["Silvia Paredes", "Calidad", "2022-04-05", 7])
ws.append(["Hugo Salvatierra", "Logística", "2021-12-01", 9])
wb.save(r"C:\Users\Pereyra\OneDrive\Documentos\FRIGOR\CONTROL DE VACACIONES\ejemplo_importacion.xlsx")
print("xlsx regenerado")
