var network;

$(function () {
    var container = document.getElementById('visjs_div');
    network = new vis.Network(container, {});
    
    $("#format").change(function () {
        if ($("#format option:selected").val() === "adjacent") {
            $("#connectedCharArea").show();
        } else {
            $("#connectedCharArea").hide();
        }
        if ($("#format option:selected").val() === "weightedAdjacent") {
            $("#nonConnectedCharArea").show();
        } else {
            $("#nonConnectedCharArea").hide();
        }
        ConvertToDot();
    }).change();
    $("#layout").change(function () {
        ConvertToDot();
    });
    $("input[name=type],input[type=checkbox]").click(ConvertToDot);
    $("#connectedChar").change(ConvertToDot);
    
});

function SampleEdge() {
    $("#input_area").val("0 1\n1 2\n1 3\n2 4\n1 5\n");
    $("#format").val("edges").change();
    ConvertToDot();
}

function SampleWeightedEdge() {
    $("#input_area").val("0 1 1\n1 2 2\n1 3 5\n2 4 2\n1 5 4\n");
    $("#format").val("weightedEdges").change();
    ConvertToDot();
}

function SampleAdjacentMatrix() {
    $("#input_area").val("NNYY\nNNYY\nNYNY\nYNNN\n");
    $("#connectedChar").val("Y");
    $("#format").val("adjacent").change();
    ConvertToDot();
}

function SampleWeightedAdjacentMatrix() {
    $("#input_area").val("-1 3 3\n2 -1 4\n-1 4 -1\n");
    $("#nonConnectedChar").val("-1");
    $("#format").val("weightedAdjacent").change();
    ConvertToDot();
}

function UpdateGraphviz() {
    var svg_div = jQuery('#graphviz_svg_div');
    svg_div.html("");
    var data = $('#graphviz_data').val();
    var svg = Viz(data, "svg");
    svg_div.html(svg);
}

var network;

function UpdateVisJs(){
    network.setData({ dot: $('#graphviz_data').val()});
    network.redraw();
}

function ConvertToDot() {
    var info = $('#input_area').val();
    var dottext = '';
    var type = $('input[name="type"]:checked').val();
    var format = $("#format option:selected").val(); 
    var layout = $("#layout option:selected").val(); 
    var arrow = "";
    var indent = "  ";

    if ($("#simple").prop("checked")) {
        dottext += "strict ";
    }

    if (type === "direct") {
        dottext += "digraph {\n";
        arrow = " -> ";
    }
    else{
        dottext += "graph {\n";
        arrow = " -- ";
    }

    dottext += indent + "rankdir = LR;\n";
    dottext += indent + "layout = " + layout +";\n";
    
    if (format === "edges") {
        var tokens = info.split(/[\s]+/).filter(function (v) { return v !== ''; });
        for (var i = 0; i + 1 < tokens.length; i += 2) {
            var from = tokens[i];
            var to = tokens[i + 1];
            dottext += indent + from + arrow + to + ";\n";
        }
    } else if (format === "weightedEdges") {
        var tokens = info.split(/[\s]+/).filter(function (v) { return v !== ''; });
        for (var i = 0; i + 2 < tokens.length; i += 3) {
            var from = tokens[i];
            var to = tokens[i + 1];
            var label = tokens[i + 2];
            dottext += indent + from + arrow + to + " [label = \"" + label + "\"];\n";
        }
    } else if (format === "adjacent") {
        var tokens = info.replace(/[\s\'\)\(\{\}\]\[\",]+/g, '');
        var n = 1;
        while (n * n <= tokens.length) n++;
        n--;

        var connectedChar = $("#connectedChar").val();
        for (var i = 0; i < n; i++)
            dottext += indent + i + ";\n";

        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (tokens[i * n + j] === connectedChar) {
                    dottext += indent + i + arrow + j + ";\n";
                }
            }
        }
    } else if (format === "weightedAdjacent") {
        var tokens = info.split(/[\s]+/).filter(function (v) { return v !== ''; });

        var n = 1;
        while (n * n <= tokens.length) n++;
        n--;

        var nonConnectedChar = $("#nonConnectedChar").val();
        for (var i = 0; i < n; i++)
            dottext += indent + i + ";\n";

        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                var label = tokens[i * n + j];
                if (label === nonConnectedChar) continue;
                dottext += indent + i + arrow + j + " [label = \"" + label + "\"];\n";
            }
        }
    }

    dottext += "}\n";
    
    $('#graphviz_data').val(dottext);

    UpdateGraphviz();
    UpdateVisJs();
}

