const text = {
  handlerPrevPage: {
    delete: {
      es: "¿Qué elemento quieres quitar?",
      en: "Which one do you want to delete?"
    },
    err: {
      en: "An error occurred while trying to go to the previous page.",
      es: "Ha ocurrido un error al ir a la página anterior"
    }
  },
  handlerDelete: {
    notFound: {
      en: "Item not found",
      es: "Elemento no encontrado en la lista de compras"
    },
    err: {
      en: "An error occurred while trying to delete the item.",
      es: "Ha ocurrido un error al intentar eliminar el elemento de la lista de compras"
    }
  },
  handlerNextPage: {
    delete: {
      es: "¿Qué elemento quieres quitar?",
      en: "Which one do you want to delete?"
    },
    err: {
      en: "An error occurred while trying to go to the next page.",
      es: "Ha ocurrido un error al ir a la página siguiente"
    }
  },
  handlerGoBack: {
    err: {
      en: "An error occurred while trying to go back.",
      es: "Ha ocurrido un error al intentar ir al menú anterior."
    }
  },
  handlerCheckItem: {
    delete: {
      es: "¿Qué elemento quieres quitar?",
      en: "Which one do you want to delete?"
    },
    err: {
      en: "An error occurred.",
      es: "Ha ocurrido un error."
    }
  },
  handlerOk: {},
  handlerClear: {
    en: "Are you sure you want to delete the whole list?",
    es: "¿Estás seguro(a) de que quieres eliminar la lista completa?"
  },
  methodAddItem: {
    ok: {
      es: "¡Okey\\! \n",
      en: "Okay\\! \n"
    },
    added: {
      es: " ahora está\\(n\\) en la lista de compras\\.",
      en: " is \\(are\\) now on the shopping list\\."
    }
  },
  methodPerformDelete: {
    ok: {
      es: "¡Okey\\! \n",
      en: "Okay\\! \n"
    },
    removed: {
      es: " ha sido eliminado de la lista de compras\\.",
      en: " removed from the shopping list\\."
    },
    oh: {
      es: "¡Oh\\!",
      en: "Oh\\!"
    },
    notFound: {
      es: "no se ha encontrado en la lista de compras\\.",
      en: "not found in the shopping list\\."
    },
    noList: {
      es: "No se ha encotrado la lista de compras en este chat\\.",
      en: "Shopping list not found for this chat\\."
    },
    errP1: {
      en: "Error removing",
      es: "Error eliminando"
    },
    errP2: {
      en: "from the shopping list\\.",
      es: "de la lista de compras\\."
    }
  },
  methodPerformGetList: {
    groceryList: {
      en: "Grocery List",
      es: "Lista de compras"
    },
    emptyList: {
      en: "Nothing to shop for\\. \nTry adding eggs\\.",
      es: "La lista está vacía\\. \n Intenta añadir huevos\\."
    },
    notFound: {
      en: "No shopping list found for this chat\\. \nStart by adding some items\\.",
      es: "No se ha encontrado una lista de compras para este chat\\. \nIntenta añadir ítems para crear una\\."
    },
    err: {
      en: "An error occurred while getting the list\\.",
      es: "Ha ocurrido un error intentando obtener la lista de compras\\."
    }
    
    
  },
  methodPerformClear: {
    cleared: {
      en: "The shopping list has been cleared\\.",
      es: "Se ha eliminado el contenido de la lista de compras\\."
    },
    notFound: {
      en: "No shopping list found for this chat\\.",
      es: "No se ha encontrad la lista de compras para este chat\\."
    },
    err: {
      en: "An error occurred while clearing the list\\.",
      es: "Ha ocurrido un error al eliminar la lista de compras\\."
    }
  },
  help: {
    help: {
      en: "Add an item: /add Eggs, Milk, Cream\n" +
        "Remove an item: /remove Eggs, Milk\n" +
        "Show the list: /list\n" +
        "Clear the list: /clear\n" +
        "This menu: /help",
      es: "Añadir un ítem: /agregar huevos, leche, crema\n" +
        "Eliminar un ítem: /quitar huevos, leche\n" +
        "Mostrar la lista: /lista\n" +
        "Eliminar la lista: /limpiar\n" +
        "Este menú: /help"
    }
  },
  command: {
    add: {
      en: "add",
      es: "agregar"
    },
    remove: {
      en: "remove",
      es: "quitar"
    },
    showList: {
      en: "list",
      es: "lista"
    },
    clear: {
      en: "clear",
      es: "limpiar"
    }
  }
}

module.exports = text