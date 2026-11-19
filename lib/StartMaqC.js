"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/StartMaqC.json";

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

	$("#numeroClpButtonC").off("click").on("click", function() {
		var numeroClp = $.trim($("#numeroClpC").val());
		if (!numeroClp || isNaN(numeroClp)) {
			alert("Informe um número de controlador (CLP) válido.");
			return;
		}
		var queue = [
			{ data: '"DataMaquinaC".numeroClpC=' + numeroClp,                           label: "NUMEROCLPC" },
			{ data: '"DataMaquinaC".topicoPublicaMaqC=' + numeroClp + "/dados",    label: "TOPICOPUBLICAMAQC" },
			{ data: '"DataMaquinaC".topicoInscreve01MaqC=' + numeroClp + "/liberar", label: "TOPICOINCREVE01MAQC" },
			{ data: '"DataMaquinaC".topicoInscreve02MaqC=' + numeroClp + "/op",      label: "TOPICOINSCREVE02MAQC" }
		];
		writeSequential(queue, 0, function() { $("#numeroClpC").val(""); });
	});

	$("#numeroSapButtonC").off("click").on("click", function() {
		var numeroSAP = $.trim($("#numeroSapC").val());
		if (!numeroSAP || isNaN(numeroSAP)) {
			alert("Informe um número SAP válido.");
			return;
		}
		var codMaq = '{"COD_MAQ":"';
		var queue = [
			{ data: '"DataMaquinaC".dadosInputMaqC[0]=' + numeroSAP,                            label: "DADOSINPUTMAQC[0]" },
			{ data: '"DataMaquinaC".mensagemOp01MaqC=' + codMaq + numeroSAP + '","TROCA_OP":1}',  label: "MENSAGEMOP01MAQC" },
			{ data: '"DataMaquinaC".mensagemOp00MaqC=' + codMaq + numeroSAP + '","TROCA_OP":0}',  label: "MENSAGEMOP00MAQC" },
			{ data: '"DataMaquinaC".mensagemLib01MaqC=' + codMaq + numeroSAP + '","LIB_MAQ":1}',  label: "MENSAGEMLIB01MAQC" },
			{ data: '"DataMaquinaC".mensagemLib00MaqC=' + codMaq + numeroSAP + '","LIB_MAQ":0}',  label: "MENSAGEMLIB00MAQC" }
		];
		writeSequential(queue, 0, function() { $("#numeroSapC").val(""); });
	});

	$("#encoderButtonC").off("click").on("click", function() {
		var encoder = $.trim($("#encoderC").val());
		if (!encoder || isNaN(encoder)) {
			alert("Informe um valor de PPR do encoder válido.");
			return;
		}
		var data = '"DadosCalibracao".qtdPulsosEncoderMaqC=' + encoder;
		S7Framework.writeData(URL, data, "QTDPULSOSENCODERMAQC", function() {
			$("#encoderC").val("");
		});
	});

	$("#ipButtonMedidorC").off("click").on("click", function() {
		var ip01 = $.trim($("#ip01C").val());
		var ip02 = $.trim($("#ip02C").val());
		var ip03 = $.trim($("#ip03C").val());
		var ip04 = $.trim($("#ip04C").val());
		if (!ip01 || !ip02 || !ip03 || !ip04 || isNaN(ip01) || isNaN(ip02) || isNaN(ip03) || isNaN(ip04)) {
			alert("Preencha todos os 4 campos do endereço IP com números válidos.");
			return;
		}
		var queue = [
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqC[1]=' + ip01, label: "IPMEDIDORENERGIAMAQC[1]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqC[2]=' + ip02, label: "IPMEDIDORENERGIAMAQC[2]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqC[3]=' + ip03, label: "IPMEDIDORENERGIAMAQC[3]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqC[4]=' + ip04, label: "IPMEDIDORENERGIAMAQC[4]" }
		];
		writeSequential(queue, 0, function() {
			$("#ip01C, #ip02C, #ip03C, #ip04C").val("");
		});
	});
};

function deployValues(values) {
	if (values && values.length >= 7) {
		var nCpu = values[0];
		if (values[0] < 10) nCpu = '000' + values[0];
		else if (values[0] < 100) nCpu = '00' + values[0];
		else if (values[0] < 1000) nCpu = '0' + values[0];

		$('#actNumeroClpC').html(nCpu);
		$('#numeroMaquinaC').html(values[1]);
		$('#pulsosEncoderPPRC').html(values[2]);
		$('#id1C').html(values[3] + '.' + values[4] + '.' + values[5] + '.' + values[6]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}