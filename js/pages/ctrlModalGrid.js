// We are just a popup controlled entirely by the form which needs to offer the user to choose
// a single record from a grid.

var ctrlModalGrid =
{
    GridID: 'divModalGrid',

    Load: function()
    {
        TriSysApex.ModalDialogue.Grid.PopulateGridFunction(ctrlModalGrid.GridID);
    }
};


$(document).ready(function ()
{
    ctrlModalGrid.Load();
});
