"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/HistProd.json";

$(document).ready(function() {
	var urlParameter = getUrlParameter();
	var tokenParam = urlParameter["userToken"];
	var hostParam = urlParameter["hostAddress"];
	if (tokenParam && hostParam) {
		userToken = tokenParam;
		hostAddress = hostParam;
		updateWebpage();
	} else {
		window.location.href = "StartApi.html";
	}
	window.onerror = function(message) {
		if (typeof toastr !== "undefined") {
			toastr.error(message, "Error", { "timeOut": "3000" });
		}
	};
});

function getUrlParameter() {
	var parameter = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(match, key, value) {
		parameter[key] = decodeURIComponent(value);
	});
	return parameter;
}

function updateWebpage() {
	if (document.getElementById('voltar')) {
		document.getElementById('voltar').setAttribute("href", "StartApi.html?userToken=" + encodeURIComponent(userToken) + "&hostAddress=" + encodeURIComponent(hostAddress));
		S7Framework.initAuto("#loading_div", $.init);
	}
}

$.init = function() {
	if (isInitialized) return;
	isInitialized = true;
	S7Framework.readData(URL, "init read data", deployValues);
};

function deployValues(values) {
	if (!values) return;

	function atualizarTabela(maqId, offsetDados, offsetSap, offsetIndex) {
		var sap = values[offsetSap] !== undefined ? values[offsetSap] : "---";
		$('#actNumeroSAPmaq' + maqId).html(sap);

		var indexAtual = parseInt(values[offsetIndex], 10);
		if (isNaN(indexAtual)) indexAtual = 0;

		var htmlLinhas = "";
		for (var linha = 0; linha < 50; linha++) {
			var posArray = indexAtual - linha;
			if (posArray < 0) posArray = posArray + 50;

			var valorParaExibir = values[offsetDados + posArray];
			if (valorParaExibir === undefined || valorParaExibir === null) valorParaExibir = "";

			htmlLinhas += "<tr><td>Metros rodados por OP: <b>" + posArray + "</b></td><td>" + valorParaExibir + "</td></tr>";
		}
		$('#corpoTabelaMaq' + maqId).html(htmlLinhas);
	}

	try {
		atualizarTabela('A', 0,   50,  51);
		atualizarTabela('B', 52,  102, 103);
		atualizarTabela('C', 104, 154, 155);
		atualizarTabela('D', 156, 206, 207);
	} catch (e) {
		console.error("Erro ao gerar a tabela HTML:", e);
	}

	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}