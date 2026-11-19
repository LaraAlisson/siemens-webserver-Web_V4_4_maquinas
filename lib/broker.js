"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/broker.json";

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

	$("#userNameButton").off("click").on("click", function() {
		var userNameMaq = $.trim($("#userNameMaq").val());
		if (!userNameMaq) {
			alert("Informe um nome de usuário válido.");
			return;
		}
		var data = '"ConfigIpLMQTT".userNameMaq=' + userNameMaq;
		S7Framework.writeData(URL, data, "USERNAMEMAQ", function() {
			$("#actNameUser").text(userNameMaq);
			$("#userNameMaq").val("");
		});
	});

	$("#passwordButton").off("click").on("click", function() {
		var passwordMaq = $.trim($("#passwordMaq").val());
		if (!passwordMaq) {
			alert("Informe uma senha válida.");
			return;
		}
		var data = '"ConfigIpLMQTT".passwordMaq=' + passwordMaq;
		S7Framework.writeData(URL, data, "PASSWORDMAQ", function() {
			$("#actPasswordMaq").text(passwordMaq);
			$("#passwordMaq").val("");
		});
	});

	["A", "B", "C", "D"].forEach(function(maq) {
		$("#connectionIdMaq" + maq + "Button").off("click").on("click", function() {
			var val = $.trim($("#connectionIdMaq" + maq).val());
			if (!val) {
				alert("Valor inválido.");
				return;
			}
			var data = '"ConfigIpLMQTT".connectionIdMaq' + maq + '=' + val;
			S7Framework.writeData(URL, data, "CONNECTIONIDMAQ" + maq, function() {
				$("#connectionIdMaq" + maq).val("");
			});
		});

		$("#clientIdentifierMaq" + maq + "Button").off("click").on("click", function() {
			var val = $.trim($("#clientIdentifierMaq" + maq).val());
			if (!val) {
				alert("Informe um identificador de cliente válido para a máquina " + maq + ".");
				return;
			}
			var data = '"ConfigIpLMQTT".clientIdentifierMaq' + maq + '=' + val;
			S7Framework.writeData(URL, data, "CLIENTEIDENTIFIERMAQ" + maq, function() {
				$("#actClientIdentifierMaq" + maq).text(val);
				$("#clientIdentifierMaq" + maq).val("");
			});
		});
	});

	$("#IpBrokerButton").off("click").on("click", function() {
		var ipB01 = $.trim($("#ipB01").val());
		var ipB02 = $.trim($("#ipB02").val());
		var ipB03 = $.trim($("#ipB03").val());
		var ipB04 = $.trim($("#ipB04").val());
		if (!ipB01 || !ipB02 || !ipB03 || !ipB04 || isNaN(ipB01) || isNaN(ipB02) || isNaN(ipB03) || isNaN(ipB04)) {
			alert("Preencha todos os 4 campos do endereço IP do Broker com números válidos.");
			return;
		}
		var queue = [
			{ data: '"ConfigIpLMQTT".ipAdressBroker[0]=' + ipB01, label: "IPADRESSBROKER[0]" },
			{ data: '"ConfigIpLMQTT".ipAdressBroker[1]=' + ipB02, label: "IPADRESSBROKER[1]" },
			{ data: '"ConfigIpLMQTT".ipAdressBroker[2]=' + ipB03, label: "IPADRESSBROKER[2]" },
			{ data: '"ConfigIpLMQTT".ipAdressBroker[3]=' + ipB04, label: "IPADRESSBROKER[3]" }
		];
		writeSequential(queue, 0, function() {
			$("#ipB01, #ipB02, #ipB03, #ipB04").val("");
		});
	});
};

function deployValues(values) {
	if (values && values.length >= 4) {
		$('#actId1').html(values[0] + '.' + values[1] + '.' + values[2] + '.' + values[3]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}