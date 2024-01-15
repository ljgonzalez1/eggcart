const path = require('path');
const db = require(path.join(__dirname, '..', 'models'));

const EggoListModel = db.EggoList;

class EggoList {
  constructor() {
  }
  
  async addItem(itemText) {
    
    try {
      const newItem = await EggoListModel.create({ item: itemText });
      return newItem;
      
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  async removeItem(itemId) {
    // Lógica para eliminar un ítem de la lista de compras
    try {
      const result = await EggoListModel.destroy({ where: { id: itemId } });
      return result;
      
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  async getItems() {
    // Lógica para obtener todos los ítems de la lista de compras
    try {
      const items = await EggoListModel.findAll();
      return items;
      
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  async updateItem(itemId, newItemData) {
    // Lógica para actualizar un ítem de la lista de compras
    try {
      const item = await EggoListModel.findByPk(itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Actualiza los campos necesarios. Ejemplo:
      item.item = newItemData.item; // Suponiendo que 'item' es un campo a actualizar
      // Si hay más campos a actualizar, repite el proceso para cada uno.
      
      await item.save(); // Guarda los cambios en la base de datos
      return item; // Retorna el ítem actualizado
      
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = EggoList;
