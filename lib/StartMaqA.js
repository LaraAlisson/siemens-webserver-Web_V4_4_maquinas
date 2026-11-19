"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/StartMaqA.json";

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

function writeSequential(items, index, onComplete) {
	if (index >= items.length) {
		if (typeof onComplete === "function") onComplete();
		return;
	}
	var item = items[index];
	S7Framework.writeData(URL, item.data, item.label, function() {
		writeSequential(items, index + 1, onComplete);
	}, function() {
		writeSequential(items, index + 1, onComplete);
	});
}

$.init = function() {
	if (isInitialized) return;
	isInitialized = true;

	S7Framework.readData(URL, "init read data", deployValues);

	$("#numeroClpButton").off("click").on("click", function() {
		var numeroClp = $.trim($("#numeroClp").val());
		if (!numeroClp || isNaN(numeroClp)) {
			alert("Informe um número de controlador (CLP) válido.");
			return;
		}
		var queue = [
			{ data: '"DataMaquinaA".numeroCLP=' + numeroClp,                           label: "NUMEROCLPA" },
			{ data: '"DataMaquinaA".topicoPublicaMaqA=' + numeroClp + "/dados",    label: "TOPICOPUBLICAMAQA" },
			{ data: '"DataMaquinaA".topicoInscreve01MaqA=' + numeroClp + "/liberar", label: "TOPICOINCREVE01MAQA" },
			{ data: '"DataMaquinaA".topicoInscreve02MaqA=' + numeroClp + "/op",      label: "TOPICOINSCREVE02MAQA" }
		];
		writeSequential(queue, 0, function() { $("#numeroClp").val(""); });
	});

	$("#numeroSapButton").off("click").on("click", function() {
		var numeroSAP = $.trim($("#numeroSap").val());
		if (!numeroSAP || isNaN(numeroSAP)) {
			alert("Informe um número SAP válido.");
			return;
		}
		var codMaq = '{"COD_MAQ":"';
		var queue = [
			{ data: '"DataMaquinaA".dadosInputMaqA[0]=' + numeroSAP,                            label: "DADOSINPUTMAQA[0]" },
			{ data: '"DataMaquinaA".mensagemOp01MaqA=' + codMaq + numeroSAP + '","TROCA_OP":1}',  label: "MENSAGEMOP01MAQA" },
			{ data: '"DataMaquinaA".mensagemOp00MaqA=' + codMaq + numeroSAP + '","TROCA_OP":0}',  label: "MENSAGEMOP00MAQA" },
			{ data: '"DataMaquinaA".mensagemLib01MaqA=' + codMaq + numeroSAP + '","LIB_MAQ":1}',  label: "MENSAGEMLIB01MAQA" },
			{ data: '"DataMaquinaA".mensagemLib00MaqA=' + codMaq + numeroSAP + '","LIB_MAQ":0}',  label: "MENSAGEMLIB00MAQA" }
		];
		writeSequential(queue, 0, function() { $("#numeroSap").val(""); });
	});

	$("#encoderButton").off("click").on("click", function() {
		var encoder = $.trim($("#encoder").val());
		if (!encoder || isNaN(encoder)) {
			alert("Informe um valor de PPR do encoder válido.");
			return;
		}
		var data = '"DadosCalibracao".qtdPulsosEncoderMaqA=' + encoder;
		S7Framework.writeData(URL, data, "QTDPULSOSENCODERMAQA", function() {
			$("#encoder").val("");
		});
	});

	$("#ipButtonMedidor").off("click").on("click", function() {
		var ip01 = $.trim($("#ip01").val());
		var ip02 = $.trim($("#ip02").val());
		var ip03 = $.trim($("#ip03").val());
		var ip04 = $.trim($("#ip04").val());
		if (!ip01 || !ip02 || !ip03 || !ip04 || isNaN(ip01) || isNaN(ip02) || isNaN(ip03) || isNaN(ip04)) {
			alert("Preencha todos os 4 campos do endereço IP com números válidos.");
			return;
		}
		var queue = [
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqA[1]=' + ip01, label: "IPMEDIDORENERGIAMAQA[1]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqA[2]=' + ip02, label: "IPMEDIDORENERGIAMAQA[2]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqA[3]=' + ip03, label: "IPMEDIDORENERGIAMAQA[3]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqA[4]=' + ip04, label: "IPMEDIDORENERGIAMAQA[4]" }
		];
		writeSequential(queue, 0, function() {
			$("#ip01, #ip02, #ip03, #ip04").val("");
		});
	});
};

function deployValues(values) {
	if (values && values.length >= 7) {
		var nCpu = values[0];
		if (values[0] < 10) nCpu = '000' + values[0];
		else if (values[0] < 100) nCpu = '00' + values[0];
		else if (values[0] < 1000) nCpu = '0' + values[0];

		$('#actNumeroClp').html(nCpu);
		$('#numeroMaquinaA').html(values[1]);
		$('#pulsosEncoderPPR').html(values[2]);
		$('#id1').html(values[3] + '.' + values[4] + '.' + values[5] + '.' + values[6]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}